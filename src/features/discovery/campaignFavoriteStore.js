/**
 * 실제 캠페인 카드의 찜 상태를 화면 전체에서 함께 쓰는 저장소입니다.
 *
 * - 로그인한 경우에만 서버에서 찜한 캠페인 ID를 한 번 불러옵니다. 로그인 계정이 바뀌면 다시 불러옵니다.
 * - 찜/해제는 서버 응답이 성공한 뒤에만 화면 상태를 바꿉니다(실패를 성공처럼 보이지 않게).
 * - 같은 캠페인 카드가 여러 곳에 있어도 useSyncExternalStore로 같은 상태를 구독합니다.
 */
import { useEffect, useSyncExternalStore } from 'react'
import {
  addFavoriteCampaign,
  getFavoriteCampaignIds,
  removeFavoriteCampaign,
} from '../../api/campaignFavoriteApi'

const listeners = new Set()
// 현재 상태: 어느 로그인 토큰으로 불러왔는지, 찜한 ID, 처리 중인 ID
let state = { token: null, ids: new Set(), pending: new Set() }

function emit(next) {
  state = next
  listeners.forEach((listener) => listener())
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// 세션 저장소를 쓸 수 없는 환경에서도 화면이 깨지지 않도록 감쌉니다.
function currentToken() {
  try {
    return sessionStorage.getItem('accessToken')
  } catch {
    return null
  }
}

// 로그인 계정이 바뀌었을 때만 찜 ID를 새로 불러옵니다. 실패하면 빈 상태로 두고 카드 사용은 막지 않습니다.
function ensureLoaded() {
  const token = currentToken()
  if (!token || token === state.token) return
  emit({ token, ids: new Set(), pending: new Set() })
  getFavoriteCampaignIds()
    .then((ids) => {
      if (state.token !== token || !Array.isArray(ids)) return
      emit({ ...state, ids: new Set(ids.map(String)) })
    })
    .catch(() => {})
}

/** 찜 상태를 바꿉니다. 서버 성공 뒤에만 반영하며 실패하면 오류를 그대로 던집니다. */
export async function toggleCampaignFavorite(campaignId) {
  const id = String(campaignId)
  if (state.pending.has(id)) return
  const saved = state.ids.has(id)
  emit({ ...state, pending: new Set(state.pending).add(id) })
  const done = (ids) => {
    const pending = new Set(state.pending)
    pending.delete(id)
    emit({ ...state, ids, pending })
  }
  try {
    await (saved ? removeFavoriteCampaign(id) : addFavoriteCampaign(id))
  } catch (error) {
    done(state.ids)
    throw error
  }
  const ids = new Set(state.ids)
  if (saved) ids.delete(id)
  else ids.add(id)
  done(ids)
}

/** 카드 하나의 찜 여부와 처리 중 여부를 돌려줍니다. 로그아웃 상태에서는 항상 찜하지 않은 상태입니다. */
export function useCampaignFavorite(campaignId) {
  useEffect(ensureLoaded, [])
  const snapshot = useSyncExternalStore(subscribe, () => state)
  const id = String(campaignId)
  const token = currentToken()
  return {
    loggedIn: Boolean(token),
    // 다른 계정으로 불러온 찜 상태는 쓰지 않습니다.
    saved: Boolean(token) && snapshot.token === token && snapshot.ids.has(id),
    busy: snapshot.pending.has(id),
  }
}

/** 찜 목록 화면에서 해제한 항목을 바로 숨기기 위해 전체 찜 ID 집합을 구독합니다. */
export function useFavoriteCampaignIds() {
  useEffect(ensureLoaded, [])
  return useSyncExternalStore(subscribe, () => state).ids
}
