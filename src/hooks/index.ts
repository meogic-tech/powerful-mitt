import { EmitterHooks } from '../emitter';
import { Commands } from '../commands';


export interface EmitterPlugin {
	all?: Commands
	name: string
	hooks?: EmitterHooks
	register(hooks: EmitterHooks, parent: EmitterPlugin): void
}
