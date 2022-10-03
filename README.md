# PowerfulMitt
Execute event prioritily, nestly, fail when previous listenser return true.At last, you can unresiger specific command by key.

## Feature
- [x] Executing by prioriy
- [x] Registering and emit nested command
- [x] Failing when previous listenser return true
- [x] Unregistering by key

...

If you can imagine any other feature, please submit a issue

## Get Start

### Install

```
npm install --save powerful-mitt
```

### Basic Using
```Typescript
import {createEmitter, Emitter} from "powerful-mitt";
const emitter = createEmitter()
const FOO_COMMAND = createCommand<[string, string], void>('foo')
emitter.on(FOO_COMMAND, (obj1: string, obj2: string) => {
  console.log(obj1, obj2);
})
emitter.emit(FOO_COMMAND, 'a', 'b')
```
Expect result
```
a b
```
### Powerful Using
```Typescript
import {createEmitter, Emitter} from "powerful-mitt";
const emitter = createEmitter({
                key: true,
                priority: true,
                failEmit: true,
                commandNest: true
            })

const FOO_COMMAND = createCommand<[string], void>('foo')
const NODE_COMMAND = createCommand<[string], void>('node')
const NODE_FOO_COMMAND = createNestCommand(NODE_COMMAND, FOO_COMMAND)
let result: string[]
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
```
#### No listeners executed
```Typescript
emitter.emit(NODE_COMMAND, '');
emitter.emit(FOO_COMMAND, '');
```
Expect result
```Typescript
result === [] // deepEqual
```
#### All listeners executed, but listener a
Because listener b executed ahead, and it return true.
```Typescript
emitter.emit(createNestCommand(NODE_COMMAND, ALL_COMMAND), '');
```
Expect result
```Typescript
result === ['c', 'b'] // deepEqual
```
#### After unresigster, some listeners executed
Only listener b execute.
```Typescript
emitter.off(NODE_FOO_COMMAND, undefined, {
  key: 'alpha'
})
emitter.emit(createNestCommand(NODE_COMMAND, ALL_COMMAND), '');
```
Expect result
```Typescript
result === ['c', 'b', 'b'] // deepEqual
```


## License

[MIT License](https://opensource.org/licenses/MIT) © [Meogic](https://meogic.com/)
