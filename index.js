const core = require('@actions/core')
const artifact = require('@actions/artifact')
const fs = require('fs')
const path = require('path')

//try {
  // `who-to-greet` your mama
  // const nameToGreet = core.getInput('who-to-greet');
  // console.log(`Hello ${nameToGreet}!`);
  //const time = (new Date()).toTimeString();
  //core.setOutput("time", time);
  // Get the JSON webhook payload for the event that triggered the workflow
  //const payload = JSON.stringify(github.context.payload, undefined, 2)
  //console.log(`The event payload: ${payload}`);
//} catch (error) {
  //core.setFailed(error.message);
//}

const FILE_NAME = "matrix-lock-17c3b450-53fd-4b8d-8df8-6b5af88022dc.lock"
const ARTIFACT_NAME = "matrix-lock"

async function run(){
  try{
    const artifactClient = artifact.create()
    const workspace = process.env.GITHUB_WORKSPACE
    const fullPath = path.join(workspace, FILE_NAME)

    const step = core.getInput('step',{required: true})
    switch (step) {
      case "init":
        const order = core.getInput('order',{required: true})
       

        fs.writeFileSync(fullPath, order)

        const uploadResponse = await artifactClient.uploadArtifact(
          ARTIFACT_NAME,
          [fullPath],
          workspace,
          { continueOnError: false }
        )

        core.info("Matrix lock initialized")

        break
      case "wait":
        const id = core.getInput('id',{required: true})
        const retryCount = core.getInput('retry-count')
        const retryDelay = core.getInput('retry-delay')

        shouldContinue = false

        for (let index = 0; index < retryCount; index++) {
          const downloadRespone = await artifactClient.downloadArtifact(
            ARTIFACT_NAME,
            [fullPath],
            workspace,
            { continueOnError: false }
          )

          const lockFile = fs.readFileSync(fullPath)

          if (id === lockFile.split(",")[0]){
            shouldContinue = true
            break
          }

          await sleep(1000 * retryDelay)
        }

        if (!shouldContinue){
          core.setFailed("Max retries reached")
        }

        core.info("Matrix unlocked, continuing")
      case "continue":
        const downloadRespone = await artifactClient.downloadArtifact(
          ARTIFACT_NAME,
          [fullPath],
          workspace,
          { continueOnError: false }
        )
        
        const lockFile = fs.readFileSync(fullPath)
        lockFile = lockFile.split(",").slice(1).join(",")

        fs.writeFileSync(fullPath, lockFile)

        const uploadResponseB = await artifactClient.uploadArtifact(
          ARTIFACT_NAME,
          [fullPath],
          workspace,
          { continueOnError: false }
        )
        
        core.info("Matrix lock freed")
        break
      default:
        core.setFailed("Unkown step: " + step)
        break
    }
  } catch (error){
    core.setFailed(error.message)
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

run()
