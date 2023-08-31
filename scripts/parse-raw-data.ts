import fs from 'fs/promises'
import walk from 'walk'
import path from 'path'

type Message = {
  id: number
  type: 'message'
  date: string
  date_unixtime: string
  from: string
  from_id: string // "user402824801"
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
  throw new Error('[ERROR]: No author ID provided! Please run the script with an authorId argument');
}

console.log({ authorId })

const run = async () => {
  const rawDataPath = path.join(__dirname, '..', 'rawData')
  const dataSetPath = path.join(__dirname, '..', 'rawData', 'dataset.json')

  const dataFiles = await findAllDataFiles(rawDataPath)

  if (!dataFiles.length) {
    throw new Error(
      `[ERROR]: Couldn't find any data from chats. Please check that you have put your exported data into 'rawData' folder and the json is named 'result.json'`,
    )
  }

  const dataSetMessages = []

  for (const filePath of dataFiles) {
    console.log(`Reading file ${filePath}...`)
    const fileData = await fs.readFile(filePath, 'utf8')

    console.log(`Parsing file ${filePath} to JSON...`)
    const fileJson: DataObject = JSON.parse(fileData)

    const textMessages = fileJson.messages.filter(
      (message) => typeof message.text === 'string' && message.text.length > 0,
    )

    if (!textMessages.some(message => message.from_id === authorId)) {
      throw new Error('[ERROR]: Wrong authorId. Please open any exported chat file and locate your `from_id` value, then rerun the script with the located argument.')
    }

    const singleDialogueDataSetMessages = textMessages.map(
      (item): DataSetMessage => {
        const role = item.from_id === authorId ? 'assistant' : 'user'
        return {
          role,
          content: item.text,
        }
      },
    )

    dataSetMessages.push(...singleDialogueDataSetMessages)
  }

  const dataSet = {
    messages: dataSetMessages,
  }

  await fs.writeFile(dataSetPath, JSON.stringify(dataSet))
}

run()
