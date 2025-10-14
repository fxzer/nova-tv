export default function Empty() {
  return (
    <div className="flex flex-col gap-2 items-center justify-center w-full py-8 text-gray-500 dark:text-gray-400">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 24 24"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          stroke-miterlimit="10"
          stroke-width="1.5"
          d="m15 9l2-6M7 9l2-6M1 9h22M3.4 3h17.2A2.4 2.4 0 0 1 23 5.4v13.2a2.4 2.4 0 0 1-2.4 2.4H3.4A2.4 2.4 0 0 1 1 18.6V5.4A2.4 2.4 0 0 1 3.4 3"
        />
      </svg>
      <div>暂无数据</div>
    </div>
  )
}
