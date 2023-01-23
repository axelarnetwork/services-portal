import { useState, useEffect, useRef } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import { Tooltip } from '@material-tailwind/react'
import { FiX } from 'react-icons/fi'

import Portal from '../portal'

export default (
  {
    id = 'portal',
    hidden,
    disabled,
    tooltip,
    onClick,
    buttonTitle,
    buttonClassName,
    title,
    icon,
    body,
    noCancelOnClickOutside = false,
    cancelDisabled = false,
    onCancel,
    cancelButtonTitle,
    cancelButtonClassName,
    confirmDisabled = false,
    onConfirm,
    onConfirmHide = true,
    confirmButtonTitle,
    confirmButtonClassName,
    onClose,
    noButtons,
    modalClassName = '',
  },
) => {
  const {
    preferences,
  } = useSelector(state =>
    (
      {
        preferences: state.preferences,
      }
    ),
    shallowEqual,
  )
  const {
    theme,
  } = { ...preferences }

  const [open, setOpen] = useState(false)

  const modalRef = useRef(null)

  const show = () => {
    if (onClick) {
      onClick(true)
    }

    setOpen(true)
  }

  const hide = () => {
    if (typeof hidden !== 'boolean') {
      setOpen(false)
    }
  }

  useEffect(
    () => {
      const handleClickOutside = e => {
        if (
          !modalRef ||
          !modalRef.current
        ) {
          return false
        }

        if (
          !open ||
          modalRef.current.contains(e.target)
        ) {
          return false
        }

        if (!cancelDisabled) {
          setOpen(!open)

          if (onClose) {
            onClose()
          }
        }
      }

      if (!noCancelOnClickOutside) {
        document
          .addEventListener(
            'mousedown',
            handleClickOutside,
          )

        return () =>
          document
            .removeEventListener(
              'mousedown',
              handleClickOutside,
            )
      }
    },
    [modalRef, open, cancelDisabled],
  )

  useEffect(
    () => {
      if (typeof hidden === 'boolean') {
        setOpen(!hidden)
      }
    },
    [hidden],
  )

  const buttonComponent =
    (
      <button
        type="button"
        disabled={disabled}
        onClick={show}
        className={
          buttonClassName ||
          'btn btn-default btn-rounded bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400 text-white'
        }
      >
        {buttonTitle}
      </button>
    )

  return (
    <>
      {
        tooltip ?
          <Tooltip
            placement="bottom"
            content={tooltip}
            className="z-50 bg-black text-white text-xs"
          >
            {buttonComponent}
          </Tooltip> :
          buttonComponent
      }
      {
        open &&
        (
          <Portal selector={`#${id}`}>
            <div className="modal-backdrop fade-in" />
            <div
              data-background={theme}
              className={`modal show ${theme === 'dark' ? 'dark' : ''}`}
            >
              <div
                ref={modalRef}
                className={`w-full ${modalClassName.includes('max-w-') ? '' : 'max-w-sm lg:max-w-lg'} relative lg:my-4 mx-auto ${modalClassName}`}
              >
                <div className="w-full bg-white dark:bg-slate-900 dark:bg-opacity-90 relative outline-none rounded-lg shadow-lg border-0 flex flex-col">
                  <div className="relative flex-auto p-4">
                    <div className="flex items-start justify-start space-x-4 p-2">
                      {
                        icon &&
                        (
                          <div className="w-12 flex-shrink-0">
                            {icon}
                          </div>
                        )
                      }
                      <div className="w-full flex flex-col">
                        <div className="uppercase tracking-wider text-lg font-medium mb-2">
                          {title}
                        </div>
                        {body}
                      </div>
                    </div>
                  </div>
                  {
                    !noButtons &&
                    (
                      <div className={`border-t border-zinc-100 dark:border-zinc-800 border-solid rounded-b flex items-center justify-end ${cancelButtonClassName?.includes('hidden') ? 'space-x-0' : 'space-x-2'} py-4 px-6`}>
                        <button
                          type="button"
                          disabled={cancelDisabled}
                          onClick={() => {
                            if (onCancel) {
                              onCancel()
                            }

                            hide()
                          }}
                          className={
                            cancelButtonClassName ||
                            'btn btn-default btn-rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800'
                          }
                        >
                          {
                            cancelButtonTitle ||
                            'Cancel'
                          }
                        </button>
                        <button
                          type="button"
                          disabled={confirmDisabled}
                          onClick={() => {
                            if (onConfirm) {
                              onConfirm()
                            }

                            if (onConfirmHide) {
                              hide()
                            }
                          }}
                          className={
                            confirmButtonClassName ||
                            'btn btn-default btn-rounded bg-blue-500 hover:bg-blue-600 dark:bg-blue-500 dark:hover:bg-blue-400 text-white'
                          }
                        >
                          {
                            confirmButtonTitle ||
                            'Confirm'
                          }
                        </button>
                      </div>
                    )
                  }
                </div>
              </div>
            </div>
          </Portal>
        )
      }
    </>
  )
}