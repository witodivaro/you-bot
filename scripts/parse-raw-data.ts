import fs from 'fs/promises'
import walk from 'walk'
import path from 'path'

type Message = {
  id: number
  type: 'message'
  date: string
  date_unixtime: string
  from: string
  from_id: string // "user402824801
  file?: string
  thumbnail?: string
  media_type?: 'sticker'
  sticker_emoji?: string
  width?: number
  height?: number
  text: string
  text_entities: TextEntity[]
}

type TextEntity = {
  type: 'plain'
  text: string
}

type DataObject = {
  name: string
  type: 'personal_chat'
  id: number
  messages: Message[]
}

type DataSetMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const [_, __, authorId] = process.argv

const MAX_TOKENS_PER_TRAINING = 1000
const MAX_CHARS_PER_TRAINING = MAX_TOKENS_PER_TRAINING * 4

const findAllDataFiles = async (rawDataPath: string): Promise<string[]> => {
  const files: string[] = []

  return new Promise((resolve, reject) => {
    const walker = walk.walk(rawDataPath, { followLinks: false })
    walker.on('file', (root, stat, next) => {
      if (stat.name === 'result.json') {
        files.push(path.join(root, stat.name))
      }

      next()
    })

    walker.on('end', () => resolve(files))
    walker.on('errors', (err) => reject(err))
  })
}

if (!authorId) {
  throw new Error(
    '[ERROR]: No author ID provided! Please run the script with an authorId argument',
  )
}

const run = async () => {
  const rawDataPath = path.join(__dirname, '..', 'rawData')

  const dataFiles = await findAllDataFiles(rawDataPath)

  if (!dataFiles.length) {
    throw new Error(
      `[ERROR]: Couldn't find any data from chats. Please check that you have put your exported data into 'rawData' folder and the json is named 'result.json'`,
    )
  }

  const trainingMessages = []

  for (const filePath of dataFiles) {
    console.log(`Reading file ${filePath}...`)
    const fileData = await fs.readFile(filePath, 'utf8')

    console.log(`Parsing file ${filePath} to JSON...`)
    const fileJson: DataObject = JSON.parse(fileData)

    const textMessages = fileJson.messages.filter(
      (message) => typeof message.text === 'string' && message.text.length > 0,
    )

    if (!textMessages.some((message) => message.from_id === authorId)) {
      throw new Error(
        '[ERROR]: Wrong authorId. Please open any exported chat file and locate your `from_id` value, then rerun the script with the located argument.',
      )
    }

    const singleDialogueMessages = textMessages.map((item): DataSetMessage => {
      const role = item.from_id === authorId ? 'assistant' : 'user'
      return {
        role,
        content: item.text,
      }
    })

    const messages = singleDialogueMessages.reduce<DataSetMessage[]>(
      (asd, item) => {
        const lastMessage = asd.at(-1)

        if (!lastMessage) {
          return [item]
        }

        if (lastMessage.role === item.role) {
          return [
            ...asd.slice(0, -1),
            { ...item, content: lastMessage.content + '. ' + item.content },
          ]
        }

        return [...asd, item]
      },
      [],
    )

    trainingMessages.push(...messages)
  }

  type DataSetInfo = {
    dataSets: DataSetMessage[][]
    charactersUsed: number
  }

  const { dataSets } = trainingMessages.reduce<DataSetInfo>(
    (dataSetInfo, message) => {
      const { dataSets, charactersUsed } = dataSetInfo

      const messageLength = message.content.length

      const isExceedingLimit =
        messageLength + charactersUsed > MAX_CHARS_PER_TRAINING
      const lastDataSet = dataSets.at(-1)

      if (isExceedingLimit) {
        return {
          dataSets: [...dataSets, [message]],
          charactersUsed: 0,
        }
      } else if (lastDataSet) {
        return {
          dataSets: [...dataSets.slice(0, -1), [...lastDataSet, message]],
          charactersUsed: charactersUsed + messageLength,
        }
      } else {
        return { dataSets: [[message]], charactersUsed: messageLength }
      }
    },
    {
      dataSets: [],
      charactersUsed: 0,
    },
  )

  const lines = []

  for (const dataSet of dataSets) {
    const trainingDataSet = {
      messages: [
        {
          role: 'system',
          content:
            "Your name is Vitali, you are 19 y.o. You are a friend, who works as a software engineer and lives alone for 2 years now. You talk about business, no-sugar. You respond egoistically, sometimes you are trying to help, but you often sound narcistic. You respond like you don't want to engage into dialogue.",
        },
        ...dataSet,
      ],
    }

    lines.push(JSON.stringify(trainingDataSet))
  }
  const dataSetPath = path.join(__dirname, '..', 'rawData', `dataset.jsonl`)
  await fs.writeFile(dataSetPath, lines.join('\n'))
}

run()
