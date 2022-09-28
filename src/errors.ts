export const GET_COMMAND_LISTENERS_ERROR = new Error(
	`
	May be you get a command first, and get it sub command
	- Just like on(createNestCommand<[string], void>(NODE_COMMAND))
	- And then on(createNestCommand<[string], void>(NODE_COMMAND, CLICK_COMMAND))
	- Then you will get this error
	- May be you should try on(createNestCommand<[string], void>(NODE_COMMAND, ALL_COMMAND))
	`
)

export const COMMAND_NAME_DUPLICATE_ERROR = new Error(
	`
	You set a duplicate command name!
	`
)
