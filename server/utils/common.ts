import Hashids from 'hashids'
import { useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()
export const hashids = new Hashids(config.idSalt, 6)
