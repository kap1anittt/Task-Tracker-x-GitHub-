from fastapi import APIRouter, Request, HTTPException
from models import tasks
from database import database
import re
import json

router = APIRouter()

def extract_task_id(text: str):
    match = re.search(r"TASK-(\d+)", text, re.IGNORECASE)
    return int(match.group(1)) if match else None

async def update_task_status(task_id: int, new_status: str):
    query = tasks.update().where(tasks.c.id == task_id).values(status=new_status)
    await database.execute(query)

async def update_task_branch(task_id: int, branch_name: str):
    query = tasks.update().where(tasks.c.id == task_id, tasks.c.branch_name == None).values(branch_name=branch_name)
    await database.execute(query)

async def add_points_to_assignee(task_id: int, points_to_add: int):
    # Сначала получаем текущие баллы и assignee
    query = tasks.select().where(tasks.c.id == task_id)
    task_data = await database.fetch_one(query)
    
    if task_data:
        # Получаем assignee (обычного или из ветки)
        current_assignee = task_data["branch_assignee_github_login"] or task_data["assignee"]
        
        if current_assignee: # Убедимся, что assignee существует
            current_points = task_data["points"] or 0
            new_points = current_points + points_to_add
            
            # Обновляем только баллы, не трогая статус или assignee
            update_query = tasks.update().where(tasks.c.id == task_id).values(points=new_points)
            await database.execute(update_query)
            print(f"Added {points_to_add} points to {current_assignee} for task {task_id}. New total: {new_points}")
        else:
             print(f"Task {task_id} has no assignee or branch assignee, points not added.")
    else:
        print(f"Task {task_id} not found, could not add points.")

@router.post("/webhook")
async def github_webhook(request: Request):
    event = request.headers.get("X-GitHub-Event")
    payload = await request.json()

    if event == "push":
        pushed_branch = payload.get("ref", "").replace("refs/heads/", "")
        
        if not pushed_branch:
             print("Could not determine pushed branch from webhook payload.")
             return {"ok": False, "reason": "Branch not found in payload"}

        for commit in payload.get("commits", []):
            commit_message = commit.get("message", "")
            if task_id := extract_task_id(commit_message):
                query = tasks.select().where(tasks.c.id == task_id, tasks.c.branch_name == pushed_branch)
                task_exists = await database.fetch_one(query)
                
                if task_exists:
                    print(f"Updating task {task_id} status to 'Ожидает ревью' due to push to branch {pushed_branch}")
                    await update_task_status(task_id, "Ожидает ревью")
                else:
                    print(f"Push to branch {pushed_branch} for task {task_id}, but branch is not linked or task not found.")

    elif event == "pull_request":
        if payload.get("action") == "closed" and payload.get("pull_request", {}).get("merged"):
            pr_data = payload.get("pull_request", {})
            body = pr_data.get("body", "")
            branch_name = pr_data.get("head", {}).get("ref", "") 
            base_branch = pr_data.get("base", {}).get("ref", "") # Получаем имя базовой ветки
            
            # Ищем ID задачи в имени ветки или теле PR
            task_id = extract_task_id(branch_name) or extract_task_id(body)
            
            if task_id:
                # Проверяем, что мерж идет в основную ветку (например, 'main' или 'master')
                # TODO: Сделать имя основной ветки настраиваемым
                if base_branch == "main" or base_branch == "master": 
                    print(f"PR for task {task_id} merged into {base_branch}. Closing task and adding points.")
                    await update_task_status(task_id, "closed")
                    # Начисляем баллы ответственному за ветку (если он назначен)
                    await add_points_to_assignee(task_id, 10) 
                else:
                     print(f"PR for task {task_id} merged into {base_branch} (not main/master). Status not changed.")
            else:
                 print(f"Could not extract task ID from merged PR (branch: {branch_name}, body: {body[:50]}...)")

    elif event == "pull_request_review":
        if payload.get("action") == "submitted":
            review_state = payload.get("review", {}).get("state") 
            reviewer_login = payload.get("review", {}).get("user", {}).get("login")
            pr_branch_name = payload.get("pull_request", {}).get("head", {}).get("ref", "")
            
            if not (review_state and reviewer_login and pr_branch_name):
                print("PR Review webhook: Missing required fields (state, reviewer, branch)")
                return {"ok": False, "reason": "Missing fields"}

            task_id = extract_task_id(pr_branch_name)
            if task_id:
                task_query = tasks.select().where(tasks.c.id == task_id)
                task_data = await database.fetch_one(task_query)

                if task_data:
                    allowed_reviewers = task_data["reviewers"]
                    try:
                        allowed_reviewers_list = allowed_reviewers if allowed_reviewers is not None else []
                    except Exception as e:
                         allowed_reviewers_list = []
                         print(f"Warning: Unexpected error processing reviewers for task {task_id}: {e}")

                    if reviewer_login in allowed_reviewers_list:
                        new_status = None
                        if review_state == "approved":
                            new_status = "Ревью пройдено"
                        elif review_state == "changes_requested":
                            new_status = "Требуются доработки"
                        
                        if new_status:
                            print(f"Updating task {task_id} status to '{new_status}' based on review by {reviewer_login}")
                            await update_task_status(task_id, new_status)
                        else:
                             print(f"Review state '{review_state}' by {reviewer_login} for task {task_id} does not trigger status change.")
                    else:
                        print(f"Review by {reviewer_login} for task {task_id} ignored: user not in allowed reviewers.")
                else:
                     print(f"Task {task_id} not found for PR review event.")
            else:
                print(f"Could not extract task ID from PR branch name: {pr_branch_name}")

    elif event == "create":
        if payload.get("ref_type") == "branch":
            branch_name = payload.get("ref")
            if branch_name:
                task_id = extract_task_id(branch_name)
                if task_id:
                    print(f"Detected branch creation for task {task_id}: {branch_name}")
                    await update_task_branch(task_id, branch_name)

    return {"ok": True}
