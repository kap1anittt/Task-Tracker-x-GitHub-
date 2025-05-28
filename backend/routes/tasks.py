from fastapi import APIRouter, HTTPException
from models import tasks
from database import database
from pydantic import BaseModel
from typing import List, Optional, Dict

router = APIRouter(prefix="/tasks")

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assignee: Optional[str] = None
    watchers: Optional[List[str]] = []
    reviewers: Optional[List[str]] = []
    image_urls: Optional[List[str]] = []

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assignee: Optional[str] = None
    status: Optional[str] = None
    watchers: Optional[List[str]] = None
    reviewers: Optional[List[str]] = None
    image_urls: Optional[List[str]] = None

class BranchAssigneeUpdate(BaseModel):
    branch_assignee_github_login: str

class TaskOut(TaskBase):
    id: int
    status: str
    points: int
    branch_name: Optional[str] = None
    branch_assignee_github_login: Optional[str] = None

    class Config:
        orm_mode = True

# Модели для ответа /stats
class StatusStat(BaseModel):
    status: str
    count: int

class PointsLeader(BaseModel):
    assignee: str
    points: int

class StatsResponse(BaseModel):
    statuses: Dict[str, int]
    points_leaders: List[PointsLeader]

@router.get("/", response_model=List[TaskOut])
async def get_tasks():
    query = tasks.select()
    return await database.fetch_all(query)

@router.post("/", response_model=TaskOut)
async def create_task(task: TaskCreate):
    query = tasks.insert().values(
        title=task.title,
        description=task.description,
        assignee=task.assignee,
        watchers=task.watchers,
        reviewers=task.reviewers,
        image_urls=task.image_urls,
        status="open",
        points=0
    )
    task_id = await database.execute(query)
    # Возвращаем созданную задачу
    created_task = await database.fetch_one(tasks.select().where(tasks.c.id == task_id))
    return created_task

@router.get("/stats", response_model=StatsResponse)
async def get_stats():
    # Получаем статистику по статусам задач
    status_stats_query = """
    SELECT status, COUNT(*) as count
    FROM tasks
    GROUP BY status
    """
    status_stats = await database.fetch_all(status_stats_query)
    
    # Получаем топ по баллам
    points_query = """
    SELECT assignee, SUM(points) as total_points
    FROM tasks
    GROUP BY assignee
    ORDER BY total_points DESC
    LIMIT 5
    """
    points_leaders = await database.fetch_all(points_query)
    
    # Преобразуем данные из БД к модели PointsLeader
    points_leaders_out = [
        PointsLeader(assignee=leader["assignee"], points=leader["total_points"]) 
        for leader in points_leaders
    ]
    
    return {
        "statuses": {stat["status"]: stat["count"] for stat in status_stats},
        "points_leaders": points_leaders_out
    }

@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(task_id: int, task_update: TaskUpdate):
    # Получаем задачу для проверки существования и начисления баллов
    get_task_query = tasks.select().where(tasks.c.id == task_id)
    current_task = await database.fetch_one(get_task_query)
    
    if not current_task:
        raise HTTPException(status_code=404, detail="Задача не найдена")

    values_to_update = task_update.dict(exclude_unset=True)

    # Если статус меняется на 'closed', начисляем баллы
    if task_update.status == "closed" and current_task.status != "closed":
        values_to_update["points"] = current_task.points + 10

    if not values_to_update:
        # Если нет полей для обновления, возвращаем текущую задачу
        return current_task

    query = tasks.update().where(tasks.c.id == task_id).values(**values_to_update)
    await database.execute(query)
    
    # Возвращаем обновленную задачу
    updated_task = await database.fetch_one(tasks.select().where(tasks.c.id == task_id))
    return updated_task

# Эндпоинт для получения одной задачи по ID
@router.get("/{task_id}", response_model=TaskOut)
async def get_task(task_id: int):
    query = tasks.select().where(tasks.c.id == task_id)
    task = await database.fetch_one(query)
    if not task:
        raise HTTPException(status_code=404, detail="Задача не найдена")
    return task

# Новый эндпоинт для назначения ответственного за ветку
@router.patch("/{task_id}/assign_branch", response_model=TaskOut)
async def assign_branch_responsible(task_id: int, assignee_update: BranchAssigneeUpdate):
    # 1. Сначала проверяем, существует ли задача
    # Вызываем read_task, который вернет 404, если задачи нет.
    await get_task(task_id)
    
    # 2. Если задача существует (иначе read_task вызвал бы исключение), обновляем ее
    query = tasks.update().where(tasks.c.id == task_id).values(
        branch_assignee_github_login=assignee_update.branch_assignee_github_login,
        assignee=assignee_update.branch_assignee_github_login # Обновляем и основное поле assignee
    )
    await database.execute(query) # Выполняем обновление

    # 3. Возвращаем обновленную задачу (снова вызываем get_task)
    return await get_task(task_id)

@router.delete("/{task_id}", status_code=204)
async def delete_task(task_id: int):
    # Сначала проверим, существует ли задача, чтобы вернуть 404, если нет
    await get_task(task_id)
    query = tasks.delete().where(tasks.c.id == task_id)
    await database.execute(query)
    return None
