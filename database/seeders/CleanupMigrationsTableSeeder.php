<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class CleanupMigrationsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all actual migration files in the database/migrations directory and subdirectories
        $files = File::allFiles(database_path('migrations'));
        
        $existingMigrations = [];
        foreach ($files as $file) {
            if ($file->getExtension() === 'php') {
                $existingMigrations[] = $file->getFilenameWithoutExtension();
            }
        }

        // Get all migrations currently recorded in the database
        $recordedMigrations = DB::table('migrations')->pluck('migration')->toArray();

        // Find the orphaned migrations (recorded in DB but file no longer exists)
        $orphanedMigrations = array_diff($recordedMigrations, $existingMigrations);

        if (!empty($orphanedMigrations)) {
            $this->command->info('Found ' . count($orphanedMigrations) . ' orphaned migrations. Cleaning up...');
            
            foreach ($orphanedMigrations as $migration) {
                DB::table('migrations')->where('migration', $migration)->delete();
                $this->command->line("Deleted: {$migration}");
            }
            
            $this->command->info('Migrations table cleaned up successfully!');
        } else {
            $this->command->info('No orphaned migrations found. Migrations table is clean.');
        }

        // Manually insert specific migrations that were renamed to prevent them from re-running and failing
        $manualMigrations = [
            '2026_03_31_000000_create_currencies_table',
            '2026_04_01_075556_create_permission_tables',
            '2026_04_01_153443_create_personal_access_tokens_table',
        ];

        $maxBatch = DB::table('migrations')->max('batch') ?? 0;
        
        foreach ($manualMigrations as $migration) {
            if (!DB::table('migrations')->where('migration', $migration)->exists()) {
                DB::table('migrations')->insert([
                    'migration' => $migration,
                    'batch' => $maxBatch + 1
                ]);
                $this->command->line("Added missing migration record: {$migration}");
            }
        }
    }
}
