import { Emitter } from '../src/emitter';
import chai, { assert, expect } from 'chai';
import { spy } from 'sinon';
import sinonChai from 'sinon-chai';
import { KeyHook } from '../src/hooks/KeyHook';
import {clearCommandCache, createCommand} from '../src/commands';
import {clearNestCommandCache} from "../src/hooks/CommandNestHook";
chai.use(sinonChai);

describe('key hook', () => {
	clearNestCommandCache()
	clearCommandCache()
	it('should delete right', () => {
		const emitter = new Emitter();
		const CLICK_COMMAND = createCommand<[string], void>('click')
		emitter.use(new KeyHook(true))

		const h1 = spy();
		const h2WithKey = spy();
		const h3WithKey = spy();
		emitter.on(CLICK_COMMAND, h1)
		emitter.on(CLICK_COMMAND, h2WithKey, {
			key: 'key1'
		})
		emitter.on(CLICK_COMMAND, h3WithKey, {
			key: 'key2'
		})
		emitter.emit(CLICK_COMMAND, 'a')
		expect(h1).to.have.been.calledOnce;
		expect(h2WithKey).to.have.been.calledOnce;
		expect(h3WithKey).to.have.been.calledOnce;
		emitter.off(CLICK_COMMAND, undefined, {
			key: 'key1'
		})
		emitter.emit(CLICK_COMMAND, 'a')
		assert.deepEqual(emitter.all.get(CLICK_COMMAND), [h1, h3WithKey])
		expect(h1).to.have.been.callCount(2);
		expect(h2WithKey).to.have.been.calledOnce;
		expect(h3WithKey).to.have.been.callCount(2);
	})
})
