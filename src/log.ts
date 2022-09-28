

export const debug = (msg: string) => {
	if (process.env.NODE_ENV === 'development'){
		console.debug('---------DEBUG', msg);
	}
}
