/**
 * 운영자 캠페인 관리 화면에서 캠페인 한 개의 신청 조건을 정하거나 해제하는 영역입니다.
 * - 조건 종류: 인스타그램 팔로워 수, 네이버 블로그 일평균 방문자(최근 4일 평균). 업체 편집 화면과 같은 입력 부품을 씁니다.
 * - 저장은 마지막으로 본 조건 버전을 함께 보내며, 업체가 먼저 바꿨다면 서버가 409로 거절합니다.
 * - 이미 신청한 참여자에게는 신청 당시 조건이 그대로 남습니다.
 * - 서버 API: PUT·DELETE /api/admin/campaigns/{id}/eligibility-requirement
 */
import { useState } from 'react'
import api from '../../api/axios'
import { AdminCard } from '../../components/admin/AdminLayout'
import RequirementFields from '../sellerCampaigns/RequirementFields'
import {
  requirementForm,
  requirementPayload,
} from '../sellerCampaigns/requirementModel'

export default function AdminRequirementEditor({ item, onDone, onCancel }) {
  const current = item.requirement ?? null
  const [form, setForm] = useState(() => requirementForm(current))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const endpoint = `/admin/campaigns/${item.id}/eligibility-requirement`

  // 조건을 저장하거나 해제합니다. 바뀐 것이 없으면 요청을 보내지 않습니다.
  const save = async () => {
    if (busy) return
    let payload
    try {
      payload = requirementPayload(form)
    } catch (problem) {
      setError(problem.message)
      return
    }
    if (!payload && !current) {
      onCancel()
      return
    }
    setBusy(true)
    setError('')
    try {
      if (payload) {
        await api.put(
          endpoint,
          { ...payload, expectedVersion: current?.version ?? null },
          { timeout: 15000 },
        )
        onDone(
          `캠페인 #${item.id} 신청 조건을 저장했습니다. 업체에 알림을 보냈습니다.`,
        )
      } else {
        await api.delete(endpoint, {
          params: { expectedVersion: current.version },
          timeout: 15000,
        })
        onDone(
          `캠페인 #${item.id} 신청 조건을 해제했습니다. 업체에 알림을 보냈습니다.`,
        )
      }
    } catch (failure) {
      setError(
        failure.response?.data?.detail ||
          '저장 결과를 확인하지 못했습니다. 최신 목록을 확인해 주세요.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminCard title={`#${item.id} 신청 조건 설정`}>
      <p>
        &lsquo;{item.title}&rsquo; 캠페인에 신청할 수 있는 채널 조건을 정합니다.
        이미 신청한 참여자에게는 신청 당시 조건이 그대로 남습니다.
      </p>
      <div className="admin-review-form">
        <RequirementFields
          value={form}
          onChange={setForm}
          disabled={busy}
          legend="신청 조건"
        />
        {error && <p role="alert">{error}</p>}
        <div className="admin-actions-row">
          <button className="admin-button" disabled={busy} onClick={save}>
            {busy ? '저장하고 있습니다' : '조건 저장'}
          </button>
          <button
            className="admin-button admin-button--secondary"
            disabled={busy}
            onClick={onCancel}
          >
            취소
          </button>
        </div>
      </div>
    </AdminCard>
  )
}
