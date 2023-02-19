import { handlers } from './issues'

import * as startHandler from './start'
import * as submitHandler from './submit'

handlers.push(startHandler, submit)

export { handlers }
