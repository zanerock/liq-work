import createError from 'http-errors'

import { claimIssues, verifyIssuesAvailable } from '@liquid-labs/github-toolkit'
import { httpSmartResponse } from '@liquid-labs/http-smart-response'
import { CredentialsDB, purposes } from '@liquid-labs/liq-credentials-db'

import { commonAssignParameters } from './_lib/common-assign-parameters'
import { WorkDB } from './_lib/work-db'

const help = {
  name        : 'Work start',
  summary     : 'Creates a new unit of work.',
  description : 'Creates a new unit of work involving the designated projects.'
}

const method = 'post'
const path = ['work', 'start']
const parameters = [
  /* TODO
  {
    name : 'allowUncomitted',
    isBoolean: true,
    description: "By default, the 'start work' process will fail if any of the target repos are unclean. Setting `allowUncomitted` will proceed if there are uncommitted files and the repos are otherwise clean."
  }, */
  {
    name         : 'projects',
    required     : true,
    isMultivalue : true,
    description  : 'The project(s) to include in the new unit of work.',
    optionsFunc  : ({ model }) => Object.keys(model.playground.projects)
  },
  ...commonAssignParameters()
]
Object.freeze(parameters)

const func = ({ app, cache, model, reporter }) => async(req, res) => {
  let { assignee, comment, issues, noAutoAssign = false, projects } = req.vars
  // normalize issues as '<org>/<project>/<issue number>'
  issues = issues.map((i) => i.match(/^\d+$/) ? projects[0] + '/' + i : i)

  for (const project of projects) {
    if (!(project in model.playground.projects)) { throw createError.BadRequest(`No such local project '${project}'. Do you need to import it?`) }
  }

  const credDB = new CredentialsDB({ app, cache })
  const authToken = credDB.getToken(purposes.GITHUB_API)

  await verifyIssuesAvailable({ authToken, issues, noAutoAssign, notClosed : true })
  await claimIssues({ assignee, authToken, comment, issues, reporter })

  const workDB = new WorkDB({ app, authToken, reporter })
  const workData = await workDB.startWork({ issues, projects, reporter })

  reporter.push(`Started work '<em>${workData.description}<rst>'.`)

  httpSmartResponse({ data : workData, msg : reporter.taskReport.join('\n'), req, res })
}

export { func, help, parameters, path, method }
