import openai from './openAi'
import fs from 'fs'
import path from 'path'

const datasetPath = path.join(__dirname, './dataset_0.jsonl')
const readStream = fs.createReadStream(datasetPath)

const run = async () => {
    const response = await openai.files.create({
      file: readStream,
      purpose: 'fine-tune',
    })

  //   const response = await openai.fineTuning.jobs.create({
  //     training_file: 'file-TT0g6s1r3JgQliYCSNWxDVOQ',
  //     model: 'gpt-3.5-turbo',
  //   })

  // const response = await openai.fineTuning.jobs.list()
  // console.log({ response: response.data })
}

run()
