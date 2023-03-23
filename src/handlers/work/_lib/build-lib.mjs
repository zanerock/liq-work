import { httpSmartResponse } from '@liquid-labs/http-smart-response'
import { tryExec } from '@liquid-labs/shell-toolkit'

import { getCommonImpliedParameters } from './common-implied-parameters'
import { determinePathHelper } from './determine-path-helper'
import { determineProjects } from './determine-projects'
import { WorkDB } from './work-db'

const doBuild = async({ app, cache, model, reporter, req, res, workKey }) => {
  const { all } = req.vars
  let { projects } = req.vars

  const workDB = new WorkDB({ app, reporter });

  ([projects, workKey] =
    await determineProjects({ all, cliEndpoint : 'work build', projects, reporter, req, workDB, workKey }))

  for (const projectFQN of projects) {
    const { projectPath } = determinePathHelper({ app, projectFQN })

    tryExec(`cd '${projectPath}' && npm run build`)
  }

  httpSmartResponse({ msg : `<bold>Built<rst> projects <em>${projects.join('<rst>, <em>')}<rst>.`, req, res })
}

const getBuildEndpointParams = ({ workDesc }) => ({
  help : {
    name        : `Work build (${workDesc})`,
    summary     : 'Builds work involved projects.',
    description : `Builds one or more projects associated with the ${workDesc} unit of work.`
  },
  method     : 'put',
  parameters : getCommonImpliedParameters({ actionDesc : 'build' })
})

export { doBuild, getBuildEndpointParams }
