/**
 * 버튼 모양과 전체 너비 옵션을 조합하고 나머지 이벤트/속성을 전달합니다.
 * 기본 type을 button으로 두어 폼 내부에서 의도하지 않은 제출을 막습니다.
 */
function Button({
  variant = 'primary',
  block = false,
  className = '',
  type = 'button',
  children,
  ...props
}) {
  const classes = [
    'ui-button',
    `ui-button--${variant}`,
    block ? 'ui-button--block' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}

export default Button
