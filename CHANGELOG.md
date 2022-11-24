# 4.0.11

## Fix
- CommandNest's off function get error when targetHandlers is undefined

# 4.0.10

## Fix
- CommandNest's off function cannot off right

# 4.0.9

## Fix
- When set priority and commandNest as true, the `on` func will set more function to `this.parent.all`

# 4.0.8

## Optimize
- Add executeHook

# 4.0.7

## Optimize
- Export EmitterPlugin

# 4.0.6

## Fix
- When using CommandNestHook, the commands is has different level, CommandNestHook will not work at off the listener


# 4.0.5

## Fix
- When using FailEmitHook, if listener func is async, FailEmitHook will not work, and warn.


# 4.0.4

## Fix
- Create command by same name, it should be equal, but `createCommand('aaa') !== createCommand('aaa')`
