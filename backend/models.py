from sqlalchemy import Table, Column, Integer, String, Boolean, JSON
from database import metadata

tasks = Table(
    "tasks",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("title", String, index=True),
    Column("description", String, nullable=True),
    Column("status", String, default="open"),
    Column("assignee", String, nullable=True),
    Column("points", Integer, default=0),
    Column("github_issue_url", String, nullable=True),
    Column("reviewers", JSON, nullable=True),
    Column("watchers", JSON, nullable=True),
    Column("image_urls", JSON, nullable=True),
    Column("branch_name", String, nullable=True),
    Column("branch_assignee_github_login", String, nullable=True)
)
