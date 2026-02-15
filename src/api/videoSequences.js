import { authFetch } from "./authFetch";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export async function fetchVideoSequences({
  sortBy = "createdAt",
  status = "all",
  search = "",
} = {}) {
  try {
    const response = await authFetch(`${BACKEND_URL}/api/projects`);
    if (!response.ok) {
      throw new Error("Failed to fetch video sequences");
    }
    const data = await response.json();

    let videoSequences = data.projects.map((sequence) => ({
      id: sequence.project_id,
      title: sequence.title,
      thumbnail: sequence.thumbnail_url,
      clipsCount: sequence.scenes_count,
      status: sequence.status === "draft" ? "draft" : sequence.status,
      createdAt: sequence.created_at,
      updatedAt: sequence.updated_at,
      description: sequence.description,
    }));

    // Filter by status
    if (status !== "all") {
      videoSequences = videoSequences.filter((sequence) => sequence.status === status);
    }

    // Filter by search
    if (search) {
      const query = search.toLowerCase();
      videoSequences = videoSequences.filter((sequence) =>
        sequence.title.toLowerCase().includes(query),
      );
    }

    // Sort
    videoSequences.sort((a, b) => {
      switch (sortBy) {
        case "createdAt":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "updatedAt":
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return videoSequences;
  } catch (error) {
    console.error("Error fetching video sequences:", error);
    return [];
  }
}

export async function fetchVideoSequence(id) {
  try {
    const response = await authFetch(`${BACKEND_URL}/api/projects/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error("Failed to fetch video sequence");
    }
    const data = await response.json();
    return {
      id: data.project_id,
      title: data.title,
      thumbnail: data.thumbnail_url,
      clipsCount: data.scene_ids?.length || 0,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      description: data.description,
      clips: data.scenes || [],
    };
  } catch (error) {
    console.error("Error fetching video sequence:", error);
    return null;
  }
}

export async function createVideoSequence(title, description = null) {
  const formData = new FormData();
  formData.append("title", title);
  if (description) {
    formData.append("description", description);
  }

  const response = await authFetch(`${BACKEND_URL}/api/projects`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to create video sequence");
  }

  return response.json();
}

export async function deleteVideoSequence(id) {
  const response = await authFetch(`${BACKEND_URL}/api/projects/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete video sequence");
  }

  return response.json();
}

export async function addClipToVideoSequence(videoSequenceId, clipId) {
  const response = await authFetch(
    `${BACKEND_URL}/api/projects/${videoSequenceId}/scenes/${clipId}`,
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to add clip to video sequence");
  }

  return response.json();
}

export async function removeClipFromVideoSequence(videoSequenceId, clipId) {
  const response = await authFetch(
    `${BACKEND_URL}/api/projects/${videoSequenceId}/scenes/${clipId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to remove clip from video sequence");
  }

  return response.json();
}

export async function concatVideoSequenceClips({
  videoSequenceId,
  startIndex,
  endIndex,
  s3Key,
}) {
  const response = await authFetch(`${BACKEND_URL}/api/projects/concat-xfade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_id: videoSequenceId,
      start_index: startIndex,
      end_index: endIndex,
      s3_key: s3Key,
    }),
  });

  return response;
}

export async function downloadConcatenatedVideoSequence({
  videoSequenceId,
  startIndex,
  endIndex,
}) {
  const response = await authFetch(`${BACKEND_URL}/api/projects/concat-xfade/download`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project_id: videoSequenceId,
      start_index: startIndex,
      end_index: endIndex,
    }),
  });

  return response;
}

export async function reorderVideoSequenceClips(videoSequenceId, clipIds) {
  const response = await authFetch(
    `${BACKEND_URL}/api/projects/${videoSequenceId}/reorder`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scene_ids: clipIds,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to reorder video clips");
  }

  return response.json();
}
