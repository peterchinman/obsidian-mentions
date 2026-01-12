export default {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src', '<rootDir>/tests'],
	testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
	],
	moduleNameMapper: {
		'^obsidian$': '<rootDir>/tests/__mocks__/obsidian.ts'
	},
	extensionsToTreatAsEsm: ['.ts'],
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			useESM: true,
			tsconfig: {
				esModuleInterop: true,
			}
		}]
	}
};
