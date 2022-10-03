import { Emitter } from '../src/emitter';
import {ALL_COMMAND, clearCommandCache, CommandListener, createCommand} from '../src/commands';
import {clearNestCommandCache, CommandNestHook, createNestCommand} from '../src/hooks/CommandNestHook';
import chai, { assert, expect } from 'chai';
import { spy } from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(sinonChai);
import { GET_COMMAND_LISTENERS_ERROR } from '../src/errors';


describe('command nest hook', () => {
	clearNestCommandCache()
	clearCommandCache()
	const NODE_COMMAND = createCommand<[], void>('node')
	const EDGE_COMMAND = createCommand<[], void>('edge')
	const CHANGE_COMMAND = createCommand<[string], void>('change')
	const MOVE_COMMAND = createCommand<[string], void>('move')
	const X_COMMAND = createCommand<[string], void>('x')
	const Y_COMMAND = createCommand<[string], void>('y')
	const a = spy()
	const b = spy()
	const c = spy()
	const d = spy()
	const e = spy()
	const f = spy()
	const g = spy()
	const h = spy()

	const func1: CommandListener<[string], boolean> = (id: string) => {
		// console.log(id)
		return false
	}
	const func2: CommandListener<[string, string], boolean> = (id: string, id2: string) => {
		// console.log(id, id2)
		return false
	}
	it('should get error', () => {
		const hook = new CommandNestHook()
		// const listeners = hook.getListenersByCommands(NODE_COMMAND)
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND), [])
		expect(() => {
			hook.getListenersByCommands(NODE_COMMAND, CHANGE_COMMAND)
		}).to.throw(GET_COMMAND_LISTENERS_ERROR)
	})
	it('should get current all listeners', () => {
		const hook = new CommandNestHook()
		const nodeNestCommandMap = new Map()
		nodeNestCommandMap.set(CHANGE_COMMAND, [a])
		nodeNestCommandMap.set(MOVE_COMMAND, [b])
		const edgeNestCommandMap = new Map()
		edgeNestCommandMap.set(CHANGE_COMMAND, [c])
		edgeNestCommandMap.set(MOVE_COMMAND, [d])
		hook.commandMap.set(NODE_COMMAND, nodeNestCommandMap)
		hook.commandMap.set(EDGE_COMMAND, edgeNestCommandMap)
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND, CHANGE_COMMAND), [a])
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND, MOVE_COMMAND), [b])
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND, ALL_COMMAND), [a, b])
		assert.deepEqual(hook.getListenersByCommands(EDGE_COMMAND, CHANGE_COMMAND), [c])
		assert.deepEqual(hook.getListenersByCommands(EDGE_COMMAND, MOVE_COMMAND), [d])
		assert.deepEqual(hook.getListenersByCommands(EDGE_COMMAND, ALL_COMMAND), [c, d])
		assert.deepEqual(hook.getListenersByCommands(ALL_COMMAND), [a, b, c, d])
	})
	it('should three level all listeners, use on func in emitter', () => {
		const emitter = new Emitter();
		const hook = new CommandNestHook()
		emitter.use(hook)
		emitter.on(createNestCommand(NODE_COMMAND, CHANGE_COMMAND, X_COMMAND), a)
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND, CHANGE_COMMAND, X_COMMAND), [a])
		emitter.on(createNestCommand(NODE_COMMAND, CHANGE_COMMAND, Y_COMMAND), b)
		emitter.on(createNestCommand(NODE_COMMAND, MOVE_COMMAND, X_COMMAND), c)
		emitter.on(createNestCommand(NODE_COMMAND, MOVE_COMMAND, Y_COMMAND), d)
		emitter.on(createNestCommand(EDGE_COMMAND, CHANGE_COMMAND, X_COMMAND), e)
		emitter.on(createNestCommand(EDGE_COMMAND, CHANGE_COMMAND, Y_COMMAND), f)
		emitter.on(createNestCommand(EDGE_COMMAND, MOVE_COMMAND, X_COMMAND), g)
		emitter.on(createNestCommand(EDGE_COMMAND, MOVE_COMMAND, Y_COMMAND), h)

		assert.deepEqual(hook.getListenersByCommands(ALL_COMMAND), [a, b, c, d, e, f, g, h])
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND, CHANGE_COMMAND, ALL_COMMAND), [a, b])
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND, MOVE_COMMAND, ALL_COMMAND), [c, d])
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND, ALL_COMMAND), [a, b, c, d])
		assert.deepEqual(hook.getListenersByCommands(EDGE_COMMAND, CHANGE_COMMAND, ALL_COMMAND), [e, f])
		assert.deepEqual(hook.getListenersByCommands(EDGE_COMMAND, MOVE_COMMAND, ALL_COMMAND), [g, h])
		assert.deepEqual(hook.getListenersByCommands(EDGE_COMMAND, ALL_COMMAND), [e, f, g, h])
		expect(() => {
			hook.getListenersByCommands(EDGE_COMMAND)
		}).to.throw(GET_COMMAND_LISTENERS_ERROR)
	})
	it('should three level all listeners', () => {
		const hook = new CommandNestHook()
		hook.getListenersByCommands(NODE_COMMAND, CHANGE_COMMAND, X_COMMAND).push(a)
		hook.getListenersByCommands(NODE_COMMAND, CHANGE_COMMAND, Y_COMMAND).push(b)
		hook.getListenersByCommands(NODE_COMMAND, MOVE_COMMAND, X_COMMAND).push(c)
		hook.getListenersByCommands(NODE_COMMAND, MOVE_COMMAND, Y_COMMAND).push(d)
		hook.getListenersByCommands(EDGE_COMMAND, CHANGE_COMMAND, X_COMMAND).push(e)
		hook.getListenersByCommands(EDGE_COMMAND, CHANGE_COMMAND, Y_COMMAND).push(f)
		hook.getListenersByCommands(EDGE_COMMAND, MOVE_COMMAND, X_COMMAND).push(g)
		hook.getListenersByCommands(EDGE_COMMAND, MOVE_COMMAND, Y_COMMAND).push(h)
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND, CHANGE_COMMAND, ALL_COMMAND), [a, b])
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND, MOVE_COMMAND, ALL_COMMAND), [c, d])
		assert.deepEqual(hook.getListenersByCommands(NODE_COMMAND, ALL_COMMAND), [a, b, c, d])
		assert.deepEqual(hook.getListenersByCommands(EDGE_COMMAND, CHANGE_COMMAND, ALL_COMMAND), [e, f])
		assert.deepEqual(hook.getListenersByCommands(EDGE_COMMAND, MOVE_COMMAND, ALL_COMMAND), [g, h])
		assert.deepEqual(hook.getListenersByCommands(EDGE_COMMAND, ALL_COMMAND), [e, f, g, h])
		assert.deepEqual(hook.getListenersByCommands(ALL_COMMAND), [a, b, c, d, e, f, g, h])
	})
	it('should execute right', () => {
		const emitter = new Emitter();
		const hook = new CommandNestHook()
		emitter.use(hook)
		emitter.on(createNestCommand(NODE_COMMAND, CHANGE_COMMAND, X_COMMAND), a)
		emitter.on(createNestCommand(NODE_COMMAND, CHANGE_COMMAND, X_COMMAND), func1)
		emitter.on(createNestCommand(NODE_COMMAND, CHANGE_COMMAND, Y_COMMAND), b)
		emitter.on(createNestCommand(NODE_COMMAND, CHANGE_COMMAND, Y_COMMAND), func2)
		emitter.on(createNestCommand(NODE_COMMAND, MOVE_COMMAND, X_COMMAND), c)
		emitter.on(createNestCommand(NODE_COMMAND, MOVE_COMMAND, Y_COMMAND), d)
		emitter.on(createNestCommand(EDGE_COMMAND, CHANGE_COMMAND, X_COMMAND), e)
		emitter.on(createNestCommand(EDGE_COMMAND, CHANGE_COMMAND, Y_COMMAND), f)
		emitter.on(createNestCommand(EDGE_COMMAND, MOVE_COMMAND, X_COMMAND), g)
		emitter.on(createNestCommand(EDGE_COMMAND, MOVE_COMMAND, Y_COMMAND), h)

		emitter.emit(createNestCommand(NODE_COMMAND, ALL_COMMAND), 'a', 'b')
		expect(a).to.have.been.calledOnce;
		expect(b).to.have.been.calledOnce;
		expect(c).to.have.been.calledOnce;
		expect(d).to.have.been.calledOnce;
		expect(e).to.have.been.callCount(0);
		expect(f).to.have.been.callCount(0);
		expect(g).to.have.been.callCount(0);
		expect(h).to.have.been.callCount(0);
		emitter.emit(createNestCommand(EDGE_COMMAND, ALL_COMMAND), 'a', 'b')
		expect(e).to.have.been.calledOnce;
		expect(f).to.have.been.calledOnce;
		expect(g).to.have.been.calledOnce;
		expect(h).to.have.been.calledOnce;
	})
	it('should create nest command exactly same', async () => {
		assert.equal(
			createCommand('aaaa'),
			createCommand('aaaa')
		)
		// @ts-ignore
		let commands = []
		const funcA = async () => {
			commands.push(createCommand('aaaa'))
		}
		funcA()
		funcA()
		await Promise.resolve().then();
		assert.equal(
			// @ts-ignore
			commands[0],
			// @ts-ignore
			commands[1],
		)
		assert.equal(
			createNestCommand(NODE_COMMAND, CHANGE_COMMAND,
				createCommand('aaaa')
			),
			createNestCommand(NODE_COMMAND, CHANGE_COMMAND,
				createCommand('aaaa')
			)
		)
	})
})
