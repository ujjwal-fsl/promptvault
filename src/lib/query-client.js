import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 10,
			onError: (error) => console.error('[QUERY ERROR]', error),
		},
		mutations: {
			onError: (error) => console.error('[MUTATION ERROR]', error),
		},
	},
});