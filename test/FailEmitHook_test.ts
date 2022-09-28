import { Emitter } from '../src/emitter';
import chai, { assert } from 'chai';
import sinonChai from 'sinon-chai';
import {clearCommandCache, createCommand} from '../src/commands';
import { FailEmitHook } from '../src/hooks/FailEmitHook';
import {clearNestCommandCache} from "../src/hooks/CommandNestHook";
chai.use(sinonChai);

describe('key hook', () => {
	clearNestCommandCache()
	clearCommandCache()
	const CLICK_COMMAND = createCommand<[string], void>('click')
	it('should fail right', () => {
		const emitter = new Emitter();
		emitter.use(new FailEmitHook())
		let i = 0
		const h1 = (a: string): boolean => {
			i ++
			return false
		};
		const h2 = (a: string): boolean => {
			i ++
			return true
		};
		emitter.on(CLICK_COMMAND, h1)
		emitter.on(CLICK_COMMAND, h2)

		emitter.emit(CLICK_COMMAND, 'A')
		assert.equal(i, 1)
	})
	it('should fail right with no reverse', () => {
		const emitter = new Emitter();
		emitter.use(new FailEmitHook(false))
		let i = 0
		const h1 = (a: string): boolean => {
			i ++
			return true
		};
		const h2 = (a: string): boolean => {
			i ++
			return false
		};
		emitter.on(CLICK_COMMAND, h1)
		emitter.on(CLICK_COMMAND, h2)

		emitter.emit(CLICK_COMMAND, 'A')
		assert.equal(i, 1)
	})
})
