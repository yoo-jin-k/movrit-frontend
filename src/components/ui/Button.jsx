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
