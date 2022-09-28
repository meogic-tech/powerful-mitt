import { Emitter } from '../src/emitter';
import chai, { assert } from 'chai';
import sinonChai from 'sinon-chai';
import { clearCommandCache, createCommand } from '../src/commands';
import { PriorityHook } from '../src/hooks/PriorityHook';
import { KeyHook } from '../src/hooks/KeyHook';
import { clearNestCommandCache } from '../src/hooks/CommandNestHook';
chai.use(sinonChai);


describe('priority hook', () => {
	clearNestCommandCache()
	clearCommandCache()
	let result = []
	const CLICK_COMMAND = createCommand<[string], void>('click')
	const a = (id: string) => {
		result.push('index1')
	}
	const b = (id: string) => {
		result.push('index2')
	}
	const c = (id: string) => {
		result.push('index3')
	}
	beforeEach(() => {
		result = []
	})
	it('should execute order right', () => {
		const emitter = new Emitter();
		emitter.use(new PriorityHook())
		const result: string[] = []
		emitter.on(CLICK_COMMAND, (id) => {
			result.push('index1')
		}, {
			priority: 1
		})
		emitter.on(CLICK_COMMAND, (id) => {
			result.push('index2')
		}, {
			priority: 0
		})
		emitter.on(CLICK_COMMAND, (id) => {
			result.push('index3')
		}, {
			priority: 2
		})
		emitter.on(CLICK_COMMAND, (id) => {
			result.push('index4')
		})
		emitter.on(CLICK_COMMAND, (id) => {
			result.push('index5')
		}, {
			priority: 1
		})
		emitter.emit(CLICK_COMMAND, 'a')
		assert.deepEqual(result, [
			'index3',
			'index1',
			'index5',
			'index2',
			'index4'
		])
	})

	it('should off right', () => {
		const emitter = new Emitter();
		const priorityHook = new PriorityHook()
		emitter.use(priorityHook)
		emitter.on(CLICK_COMMAND, a, {
			priority: 1
		})
		emitter.on(CLICK_COMMAND, b, {
			priority: 3
		})
		emitter.on(CLICK_COMMAND, c, {
			priority: 3
		})
		emitter.off(CLICK_COMMAND, c)
		assert.deepEqual(priorityHook.priorityArray, [
			[],
			[[CLICK_COMMAND, a]],
			[],
			[[CLICK_COMMAND, b]]
		])
	})

	it('should off right and with key test', () => {
		const emitter = new Emitter();
		const priorityHook = new PriorityHook()
		emitter.use(priorityHook)
		emitter.use(new KeyHook(true))
		emitter.on(CLICK_COMMAND, a, {
			priority: 1,
			key: 'alpha'
		})
		emitter.on(CLICK_COMMAND, b, {
			priority: 1,
			key: 'beta'
		})
		emitter.on(CLICK_COMMAND, c, {
			priority: 1,
			key: 'beta'
		})
		emitter.off(CLICK_COMMAND, undefined, {
			key: 'alpha'
		})
		assert.deepEqual(priorityHook.priorityArray, [
			[],
			[[CLICK_COMMAND, b], [CLICK_COMMAND, c]]
		])

		emitter.off(CLICK_COMMAND, undefined, {
			key: 'beta'
		})
		assert.deepEqual(priorityHook.priorityArray, [
			[],
			[]
		])
	})
})
