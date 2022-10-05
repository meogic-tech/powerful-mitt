import { Emitter, EmitterHooks } from '../src/emitter'
// @ts-ignore
import { createEmitter, MittCommand, CommandListener, AsArray, EmitterPlugin } from '../src';
import chai, {  expect, assert } from 'chai';
import { spy } from 'sinon';
import sinonChai from 'sinon-chai';
import { ALL_COMMAND, clearCommandCache, createCommand } from '../src/commands';
import { FailEmitHook } from '../src/hooks/FailEmitHook';
import { clearNestCommandCache, CommandNestHook, createNestCommand } from '../src/hooks/CommandNestHook';
import { KeyHook } from '../src/hooks/KeyHook';
import { PriorityHook } from '../src/hooks/PriorityHook';
chai.use(sinonChai);
describe('base emitter', () => {
	let emitter: Emitter
	clearNestCommandCache()
	clearCommandCache()
	const FOO_COMMAND = createCommand<[string, string], void>('foo')
	const CLICK_COMMAND = createCommand<[string], void>('click')
	let a = spy();
	let b = spy();
	beforeEach(() => {
		const map = new Map();
		a = spy();
		b = spy();
		map.set(FOO_COMMAND, [a, b]);
		emitter = new Emitter(map);
	})
	it('should add', () => {
		const c = spy()
		emitter.on(CLICK_COMMAND, c)
		assert.deepEqual(emitter.all.get(FOO_COMMAND), [a, b])
		assert.deepEqual(emitter.all.get(CLICK_COMMAND), [c])
	});
	it('should emit', () => {
		let result = ''
		const c = (id: string) => {
			result+=id
		}
		const d = (...args: unknown[]) => {
			result += JSON.stringify(args)
		}
		emitter.on(CLICK_COMMAND, c)
		emitter.on(ALL_COMMAND, d)
		emitter.emit(FOO_COMMAND, 'a', 'b')
		emitter.emit(CLICK_COMMAND, 'c')
		expect(a).to.have.been.calledOnce;
		expect(b).to.have.been.calledOnce;
		assert.deepEqual(result, '[{"name":"foo"},["a","b"]]c[{"name":"click"},["c"]]')
	})
	it('should off', () => {
		const c = spy()
		const d = spy()
		emitter.on(CLICK_COMMAND, c)
		emitter.on(ALL_COMMAND, d)
		emitter.emit(FOO_COMMAND, '1', '2')
		emitter.emit(CLICK_COMMAND, 'a')
		expect(a).to.have.been.calledOnce;
		expect(b).to.have.been.calledOnce;
		expect(c).to.have.been.calledOnce;
		expect(d).to.have.been.callCount(2);
		emitter.off(FOO_COMMAND)
		emitter.off(CLICK_COMMAND)
		expect(Array.isArray(emitter.all.get(FOO_COMMAND))).to.deep.equal(true)
		expect((emitter.all.get(FOO_COMMAND) as Array<any>).length).to.deep.equal(0);
		expect((emitter.all.get(CLICK_COMMAND) as Array<any>).length).to.deep.equal(0);
	})
})

describe('multi hook', () => {
	clearNestCommandCache()
	clearCommandCache()
	let emitter: Emitter = new Emitter();
	const FOO_COMMAND = createCommand<[string], void>('foo')
	const NODE_COMMAND = createCommand<[string], void>('node')
	const NODE_FOO_COMMAND = createNestCommand(NODE_COMMAND, FOO_COMMAND)
	const a = () => {
		result.push('a')
	}
	const b = () => {
		result.push('b')
		return true
	}
	const c = () => {
		result.push('c')
	}
	let result: string[]
	beforeEach(() => {
		clearNestCommandCache()
		clearCommandCache()
		emitter = new Emitter();
		result = []
	})
	it('should execute commandNest success when has CommandNestHook and FailEmitHook', () => {
		emitter.use(new CommandNestHook())
		emitter.use(new FailEmitHook())
		emitter.on(NODE_FOO_COMMAND, a)
		emitter.on(NODE_FOO_COMMAND, b)
		emitter.on(NODE_FOO_COMMAND, c)
		emitter.emit(NODE_COMMAND, '');
		emitter.emit(FOO_COMMAND, '');
		assert.deepEqual(result, [])
		emitter.emit(NODE_FOO_COMMAND, '')
		assert.deepEqual(result, ['c', 'b'])
	})
	it('should execute failEmit success when has CommandNestHook and FailEmitHook', () => {
		emitter.use(new CommandNestHook())
		emitter.use(new FailEmitHook())
		emitter.on(FOO_COMMAND, a)
		emitter.on(FOO_COMMAND, b)
		emitter.on(FOO_COMMAND, c)
		emitter.emit(FOO_COMMAND, '')
		assert.deepEqual(result, [ 'c', 'b' ])
	})
	it('should execute commandNest success when CommandNestHook and KeyHook', () => {
		emitter.use(new CommandNestHook())
		emitter.use(new KeyHook())
		emitter.on(NODE_FOO_COMMAND, a, {
			key: 'alpha'
		})
		emitter.on(NODE_FOO_COMMAND, b, {
			key: 'beta'
		})
		emitter.on(NODE_FOO_COMMAND, c, {
			key: 'alpha'
		})
		emitter.emit(NODE_COMMAND, '');
		emitter.emit(FOO_COMMAND, '');
		assert.deepEqual(result, [])
		emitter.emit(NODE_FOO_COMMAND, '')
		assert.deepEqual(result, [ 'a', 'b', 'c' ])
	})
	it('should execute Keyed success when CommandNestHook and KeyHook', () => {
		const commandNestHook = new CommandNestHook()

		/**
		 * <h1>must after keyHook</h1>
		 * Because in off hook, keyHook delete handler by key at first
		 * And then, commandNestHook get deleted all: Commands, and deleted it's own CommandNest
		 */
		emitter.use(new KeyHook())
		emitter.use(commandNestHook)
		emitter.on(NODE_FOO_COMMAND, a, {
			key: 'alpha'
		})
		emitter.on(NODE_FOO_COMMAND, b, {
			key: 'beta'
		})
		emitter.on(NODE_FOO_COMMAND, c, {
			key: 'alpha'
		})
		// commandNestHook.findSubCommand(commandNestHook.commandMap, (array) => {
		// 	console.log("array", array);
		// })
		emitter.off(NODE_FOO_COMMAND, undefined, {
			key: 'alpha'
		})
		emitter.emit(NODE_COMMAND, '');
		emitter.emit(FOO_COMMAND, '');
		assert.deepEqual(result, [])
		emitter.emit(NODE_FOO_COMMAND, '')
		assert.deepEqual(result, ['b'])
	})
	it('should execute commandNest success when CommandNestHook and PriorityHook', () => {
		emitter.use(new PriorityHook())
		emitter.use(new CommandNestHook())
		emitter.on(NODE_FOO_COMMAND, a, {
			priority: 1
		})
		emitter.on(NODE_FOO_COMMAND, b, {
			priority: 2
		})
		emitter.on(NODE_FOO_COMMAND, c, {
			priority: 3
		})
		emitter.emit(NODE_COMMAND, '');
		emitter.emit(FOO_COMMAND, '');
		assert.deepEqual(result, [])
		emitter.emit(createNestCommand(NODE_COMMAND, ALL_COMMAND), '')
		assert.deepEqual(result, [ 'c', 'b', 'a' ])
	})
	it('should execute success when all set', () => {
		const emitter = createEmitter({
			key: true,
			priority: true,
			commandNest: true,
			failEmit: true
		})
		emitter.on(NODE_FOO_COMMAND, a, {
			priority: 1,
			key: 'alpha'
		})
		emitter.on(NODE_FOO_COMMAND, b, {
			priority: 2,
			key: 'beta'
		})
		emitter.on(NODE_FOO_COMMAND, c, {
			priority: 3,
			key: 'alpha'
		})
		emitter.emit(NODE_COMMAND, '');
		emitter.emit(FOO_COMMAND, '');
		assert.deepEqual(result, [])
		emitter.emit(createNestCommand(NODE_COMMAND, ALL_COMMAND), '')
		assert.deepEqual(result, [ 'c', 'b' ])
		emitter.off(NODE_FOO_COMMAND, undefined, {
			key: 'alpha'
		})
		emitter.emit(createNestCommand(NODE_COMMAND, ALL_COMMAND), '')
		assert.deepEqual(result, [ 'c', 'b', 'b' ])
	})
	it('should execute success when without priority', () => {
		const emitter = createEmitter({
			key: true,
			priority: false,
			commandNest: true,
			failEmit: true
		})
		emitter.on(NODE_FOO_COMMAND, a, {
			key: 'alpha'
		})
		emitter.on(NODE_FOO_COMMAND, b, {
			key: 'beta'
		})
		emitter.on(NODE_FOO_COMMAND, c, {
			key: 'alpha'
		})
		emitter.emit(NODE_COMMAND, '');
		emitter.emit(FOO_COMMAND, '');
		assert.deepEqual(result, [])
		emitter.emit(createNestCommand(NODE_COMMAND, ALL_COMMAND), '')
		assert.deepEqual(result, [ 'c', 'b' ])
		emitter.off(NODE_FOO_COMMAND, undefined, {
			key: 'alpha'
		})
		emitter.emit(createNestCommand(NODE_COMMAND, ALL_COMMAND), '')
		assert.deepEqual(result, [ 'c', 'b', 'b' ])
	})

	it('should async execute correct', async () => {

		const emitter = createEmitter({
			key: true,
			priority: true,
			failEmit: true,
			commandNest: true
		});
		const result: string[] = []
		const func1 = async () => {
			result.push('func1')
		}
		const func2 = async () => {
			result.push('func2')
		}
		emitter.on(createNestCommand(NODE_COMMAND), func1)
		emitter.on(createNestCommand(NODE_COMMAND), func2)
		emitter.emit(createNestCommand(NODE_COMMAND))
		assert.deepEqual(result, ['func1', 'func2'])
	})
	it('should off right', () => {
		const emitter = createEmitter({
			key: true,
			priority: true,
			failEmit: true,
			commandNest: true
		});
		const DOCUMENT_NOTE_UPDATED_A_COMMAND = createNestCommand(createCommand('DOCUMENT'), createCommand('NOTE_UPDATED'), createCommand('a'))
		const log: string[] = []
		const a = async () => {
			log.push('a')
		}
		const b = async () => {
			log.push('b')
		}
		emitter.on(DOCUMENT_NOTE_UPDATED_A_COMMAND, a, {
			key: 'a'
		})
		emitter.on(DOCUMENT_NOTE_UPDATED_A_COMMAND, b, {
			key: 'b'
		})
		emitter.emit(DOCUMENT_NOTE_UPDATED_A_COMMAND, '')
		emitter.off(DOCUMENT_NOTE_UPDATED_A_COMMAND, undefined, {
			key: 'a'
		})
		emitter.emit(DOCUMENT_NOTE_UPDATED_A_COMMAND, '')
		assert.deepEqual(log, ['a', 'b', 'b'])
	})
	it('should execute executeHook right', () => {
		const emitter = createEmitter({
			key: true,
			priority: true,
			failEmit: true,
			commandNest: true
		});
		const log: string[] = []
		class EmitLogHook implements EmitterPlugin{
			name: string

			constructor() {
				this.name = 'EmitLogHook';
			}

			register(hooks: EmitterHooks, parent: EmitterPlugin): void {
				// @ts-ignore
				hooks.executeHook.tap(this.name, (command, handler) => {
					log.push(`execute ${command.name} ${handler.name}`)
					console.log(`execute ${command.name} ${handler.name}`)
				})
			}

		}
		emitter.use(new EmitLogHook())
		emitter.on(FOO_COMMAND, a)
		emitter.emit(FOO_COMMAND, '')
		assert.deepEqual(log, ['execute foo a'])

	})
})
