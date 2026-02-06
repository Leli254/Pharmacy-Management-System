# app/routers/admin_router.py
import os
import subprocess
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.utils.jwt import get_current_user
from app.models.user import User

router = APIRouter(tags=["Admin"])


@router.post("/backup", summary="Trigger a manual database backup")
def trigger_backup(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Creates a .sql dump of the PostgreSQL database and saves it to the /app/backups folder.
    Only accessible by users with the 'admin' role.
    """
    # 1. Security Check
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform backups."
        )

    # 2. Setup Paths
    backup_dir = "/app/backups"
    if not os.path.exists(backup_dir):
        try:
            os.makedirs(backup_dir)
        except Exception as e:
            raise HTTPException(
                status_code=500, detail=f"Cannot create backup directory: {str(e)}")

    # 3. Define Filename
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    filename = f"manual_backup_{timestamp}.sql"
    filepath = os.path.join(backup_dir, filename)

    # 4. Prepare pg_dump command
    command = [
        "pg_dump",
        "-h", "db",
        "-U", "postgres",
        "-d", "pharmacy",
        "-f", filepath
    ]

    try:
        # Pass the password via environment variable
        env = os.environ.copy()
        env["PGPASSWORD"] = "postgres"

        # Run the command
        subprocess.run(command, env=env, check=True,
                       capture_output=True, text=True)

        # Calculate file size in MB
        file_size_bytes = os.path.getsize(filepath)
        file_size_mb = round(file_size_bytes / (1024 * 1024), 2)

        return {
            "status": "success",
            "message": "Database backup created successfully.",
            "filename": filename,
            "size_mb": file_size_mb,
            "location": "Host /backups folder"
        }

    except subprocess.CalledProcessError as e:
        print(f"Backup Error: {e.stderr}")
        raise HTTPException(
            status_code=500,
            detail=f"Database dump failed: {e.stderr}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred: {str(e)}"
        )
