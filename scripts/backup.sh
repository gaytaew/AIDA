#!/bin/bash

# Configuration
BACKUP_DIR="_backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
PROJECT_NAME="aida_backup"
BACKUP_FILE="${BACKUP_DIR}/${PROJECT_NAME}_${TIMESTAMP}.tar.gz"

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo "Created backup directory: $BACKUP_DIR"
fi

# Create the backup
echo "Creating backup..."
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='_backups' \
    --exclude='.DS_Store' \
    --exclude='dist' \
    --exclude='build' \
    -czf "$BACKUP_FILE" .

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    echo "Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Backup failed!"
    exit 1
fi
