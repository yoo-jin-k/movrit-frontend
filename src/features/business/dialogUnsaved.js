/**
 * 업체 상세 창(DetailDialog) 안의 입력 영역이 '저장하지 않은 내용이 있다'고 알리는 통로입니다.
 * 상세 창은 이 알림을 모아 닫기 전에 확인 안내를 띄웁니다.
 */
import { createContext, useContext, useEffect, useId } from 'react'

export const UnsavedContext = createContext(() => {})

// 상세 창 안에 그려지는 컴포넌트가 저장하지 않은 입력 여부를 알립니다. 화면에서 사라지면 '없음'으로 되돌립니다.
export function useDialogUnsaved(unsaved) {
  const report = useContext(UnsavedContext)
  const key = useId()
  useEffect(() => {
    report(key, Boolean(unsaved))
    return () => report(key, false)
  }, [report, key, unsaved])
}
