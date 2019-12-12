

module.exports = {
    "type": "sqlite",
    "database": "./tulip-server.db",
    "entities": [
        "src/models/**/*.ts"
    ],
    "migrations": ["db/migrations/**/*.ts"],
    "synchronize": false,
    "cli": {
        "entitiesDir": "src/models/**",
        "migrationsDir": "db/migrations",
        "subscribersDir": "db/subscribers"
    }
}
