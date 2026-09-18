package com.tattantat.app.core.database

import androidx.room.Database
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.RoomDatabase

/** Reserved local cache boundary; repositories own synchronization policy. */
@Entity(tableName = "cached_products")
data class CachedProductEntity(@PrimaryKey val id: String, val title: String, val updatedAt: Long)

@Database(entities = [CachedProductEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase()
