from pydantic import BaseModel, Field
from typing import List, Optional

class TargetCreateRequest(BaseModel):
    name: str = Field(..., description="Target human-readable name")
    url: str = Field(..., description="Public HTTP/HTTPS URL")
    check_interval: Optional[str] = "Every 5m"
    selector_mode: Optional[str] = "Full Page DOM"
    css_selector: Optional[str] = None
    alert_channels: Optional[List[str]] = ["slack", "discord"]

class TargetUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, description="Updated human-readable name")
    url: Optional[str] = Field(None, description="Updated public HTTP/HTTPS URL")
    check_interval: Optional[str] = Field(None, description="Updated check interval")
    selector_mode: Optional[str] = Field(None, description="Updated selector mode")
    css_selector: Optional[str] = Field(None, description="Updated CSS selector")
    alert_channels: Optional[List[str]] = Field(None, description="Updated alert channels")

class TargetResponse(BaseModel):
    id: str
    name: str
    url: str
    code: str
    status: str
    http_status: int
    check_interval: str
    selector_mode: str
    css_selector: Optional[str] = None
    alert_channels: List[str]
    last_checked: Optional[str] = None
    last_changed: Optional[str] = None
    error_message: Optional[str] = None
    change_count: int
    uptime_percent: float
    latency_ms: int
    created_at: str

class SnapshotResponse(BaseModel):
    id: str
    target_id: str
    version_tag: str
    text_content: str
    word_count: int
    http_status: int
    latency_ms: int
    change_summary: Optional[str] = None
    created_at: str

class ChangeResponse(BaseModel):
    id: str
    target_id: str
    target_name: str
    target_url: str
    timestamp: str
    words_added: int
    words_removed: int
    change_type: str
    summary: str
    selector: str
    old_snapshot_id: Optional[str] = None
    new_snapshot_id: Optional[str] = None
    severity: str

class CheckResultResponse(BaseModel):
    target_id: str
    has_changes: bool
    status: str
    http_status: int
    latency_ms: int
    words_added: int
    words_removed: int
    message: str

class SystemStatsResponse(BaseModel):
    total_targets: int
    healthy_targets: int
    alert_targets: int
    paused_targets: int
    total_changes: int
    avg_latency_ms: int
    operational_percent: str
