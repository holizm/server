import { errorAndExit } from './logger.js'

export const ensure = (condition, message) => {
    if (!condition) {
        errorAndExit(message)
    }
}
