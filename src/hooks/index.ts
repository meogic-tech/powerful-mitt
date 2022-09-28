import { EmitterHooks } from '../emitter';
import { Commands } from '../commands';


export interface EmitterPlugin {
	all?: Commands
	name: string
	register(hooks: EmitterHooks, parent: EmitterPlugin): void
}
