# 4.0.6

## Fix
- When using CommandNestHook, the commands is has different level, CommandNestHook will not work at off the listener


# 4.0.5

## Fix
- When using FailEmitHook, if listener func is async, FailEmitHook will not work, and warn.


# 4.0.4

## Fix
- Create command by same name, it should be equal, but `createCommand('aaa') !== createCommand('aaa')`
