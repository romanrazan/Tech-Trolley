"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const typeorm_1 = require("typeorm");
const app_module_1 = require("./src/app.module");
async function main() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: false,
    });
    try {
        const dataSource = app.get(typeorm_1.DataSource);
        const schemaBuilder = dataSource.driver.createSchemaBuilder();
        const queries = await schemaBuilder.log();
        console.log(JSON.stringify(queries.upQueries.map((query) => query.query), null, 2));
    }
    finally {
        await app.close();
    }
}
void main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
//# sourceMappingURL=schema-compare.codex.js.map