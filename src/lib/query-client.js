import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
			onError: (error) => console.error('[QUERY ERROR]', error),
		},
		mutations: {
			onError: (error) => console.error('[MUTATION ERROR]', error),
		},
	},
});