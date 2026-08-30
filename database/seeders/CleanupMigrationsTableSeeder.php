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
    }
}
