export default function HomePage() {
  return (
    <main className='container mx-auto px-4 py-8'>
      <div className='flex flex-col items-center justify-center min-h-[60vh] text-center'>
        <h1 className='text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl'>SmartNippo</h1>
        <p className='mt-6 text-lg leading-8 text-gray-600 max-w-2xl'>
          モダンな日報管理アプリケーション。AI アシスタントによる要約機能と、
          リアルタイム承認フローで、チームの生産性を向上させます。
        </p>
        <div className='mt-10 flex items-center justify-center gap-x-6'>
          <a
            href='/dashboard'
            className='rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
          >
            ダッシュボードへ
          </a>
          <a href='/auth/login' className='text-sm font-semibold leading-6 text-gray-900'>
            ログイン <span aria-hidden='true'>→</span>
          </a>
        </div>
      </div>

      <div className='mt-16 grid grid-cols-1 md:grid-cols-3 gap-8'>
        <div className='text-center'>
          <div className='bg-indigo-100 rounded-lg p-6 mb-4'>
            <h3 className='text-lg font-semibold mb-2'>AI要約機能</h3>
            <p className='text-gray-600'>
              日報の内容を AI が自動で要約し、重要なポイントを抽出します。
            </p>
          </div>
        </div>

        <div className='text-center'>
          <div className='bg-green-100 rounded-lg p-6 mb-4'>
            <h3 className='text-lg font-semibold mb-2'>リアルタイム承認</h3>
            <p className='text-gray-600'>
              承認者に即座に通知が届き、スムーズな承認フローを実現します。
            </p>
          </div>
        </div>

        <div className='text-center'>
          <div className='bg-yellow-100 rounded-lg p-6 mb-4'>
            <h3 className='text-lg font-semibold mb-2'>マルチプラットフォーム</h3>
            <p className='text-gray-600'>
              Web・iOS・Android で同一の体験を提供し、いつでもどこでも利用可能。
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
