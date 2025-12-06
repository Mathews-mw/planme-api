// repetimos o CamelToSnake visto antes
type CamelToSnake<S extends string> = S extends `${infer Head}${infer Tail}`
	? Tail extends Uncapitalize<Tail>
		? `${Lowercase<Head>}${CamelToSnake<Tail>}`
		: `${Lowercase<Head>}_${CamelToSnake<Tail>}`
	: S;

// Gerar a saída removendo os campos E, e renomeando o resto
type TransformResult<I, E extends keyof I = never> = {
	[K in Exclude<keyof I, E> as CamelToSnake<K & string>]: I[K] extends Record<string, any>
		? TransformResult<I[K], E & keyof I[K]> // recursão em nested objects
		: I[K];
};

export class TransformerSchema {
	/** Converte camelCase → snake_case */
	static toSnakeCase(str: string): string {
		return str.replace(/([A-Z])/g, '_$1').toLowerCase();
	}

	/**
	 * Transforma recursivamente um objeto camelCase em snake_case,
	 * removendo as chaves listadas em `exclude`.
	 * Tratamos Date (e derivados) como valores “finais” para não iterar sobre eles.
	 */
	static transformSchema<I extends Record<string, any>, E extends keyof I = never>(
		input: I,
		exclude: readonly E[] = []
	): TransformResult<I, E> {
		const excludeSet = new Set(exclude.map((key) => this.toSnakeCase(key as string)));

		if (Array.isArray(input)) {
			return input.map((item) => this.transformSchema(item, exclude)) as TransformResult<I, E>;
		}

		if (input !== null && typeof input === 'object') {
			const output: any = {};
			for (const [key, value] of Object.entries(input)) {
				const snakeKey = this.toSnakeCase(key);
				if (excludeSet.has(snakeKey)) continue; // pula campos excluídos
				output[snakeKey] = this.transformSchema(value, exclude);
			}
			return output;
		}

		return input as any;
	}
}
