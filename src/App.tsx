import { useState } from 'react';
import { initialPosts, type Post } from './data/posts';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { 
  Terminal, 
  BookOpen, 
  Tag as TagIcon, 
  User as UserIcon, 
  Search, 
  Calendar, 
  Clock, 
  ArrowLeft, 
  TrendingUp, 
  Cpu, 
  ShieldAlert, 
  Globe, 
  Newspaper,
  ChevronRight,
  Github,
  Award
} from 'lucide-react';

export default function App() {
  const [posts] = useState<Post[]>(initialPosts);
  const [currentPage, setCurrentPage] = useState<'home' | 'post' | 'about'>('home');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'blog' | 'ai-news'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 整理所有的 tags 及其对应的数量
  const tagCounts = posts.reduce((acc: { [key: string]: number }, post) => {
    post.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  // 过滤后的文章列表
  const filteredPosts = posts.filter(post => {
    // 分类过滤
    if (selectedCategory !== 'all' && post.category !== selectedCategory) {
      return false;
    }
    // 标签过滤
    if (selectedTag && !post.tags.includes(selectedTag)) {
      return false;
    }
    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(query);
      const matchSummary = post.summary.toLowerCase().includes(query);
      const matchContent = post.content.toLowerCase().includes(query);
      const matchTags = post.tags.some(t => t.toLowerCase().includes(query));
      return matchTitle || matchSummary || matchContent || matchTags;
    }
    return true;
  });

  // 获取当前正在阅读的文章
  const currentPost = posts.find(p => p.id === selectedPostId);

  const navigateToHome = () => {
    setCurrentPage('home');
    setSelectedPostId(null);
  };

  const selectPost = (id: string) => {
    const post = posts.find(p => p.id === id);
    if (post && post.category === 'ai-news') {
      // AI 日报直接整页跳转到原始 HTML
      window.location.href = `/news-html/ai-news-${post.date}.html`;
      return;
    }
    setSelectedPostId(id);
    setCurrentPage('post');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null); // 取消选择
    } else {
      setSelectedTag(tag);
      setSelectedCategory('all'); // 清除分类限制方便查看全部该 tag 的文章
    }
    setCurrentPage('home');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* 顶部通栏/导航 */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={navigateToHome}>
            <div className="bg-gradient-to-tr from-slate-900 to-indigo-600 p-2 rounded-lg text-white">
              <Terminal size={20} className="animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-600 bg-clip-text text-transparent">
                OpsTech Notes
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                SRE & DevOps & AIOps
              </span>
            </div>
          </div>

          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button 
              onClick={navigateToHome}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === 'home' 
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen size={16} />
              <span>首页博客</span>
            </button>
            <button 
              onClick={() => { setCurrentPage('about'); setSelectedPostId(null); }}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentPage === 'about' 
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserIcon size={16} />
              <span>关于站长</span>
            </button>
          </nav>
        </div>
      </header>

      {/* 博客 Banner */}
      {currentPage === 'home' && (
        <section className="bg-slate-900 text-slate-100 relative overflow-hidden py-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950/90 to-slate-950"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
          
          <div className="container mx-auto px-4 relative z-10 max-w-6xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full mb-6">
                <Cpu size={12} className="animate-spin-slow" />
                <span>运维技术与人工智能的交汇点</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-6">
                构建高可用、智能化的 <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-indigo-300 via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                  DevOps 与 AIOps 架构
                </span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                分享高可用集群搭建、Nginx性能调优、Playwright自动化证书签发等生产环境实战经验。
                每日AI日报模块自动为你整理前沿AIOps资讯，助力技术领先一步。
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 max-w-lg">
                <div className="relative flex-1">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索运维实战、命令、配置文件或AI新闻..."
                    className="w-full pl-10 pr-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white border border-slate-700 focus:border-indigo-500 rounded-xl text-slate-100 focus:text-slate-900 placeholder-slate-400 transition-all duration-300 outline-none text-sm"
                  />
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold transition-all duration-200"
                  >
                    重置
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 主体区域 */}
      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
        {currentPage === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* 左侧大列表 */}
            <div className="lg:col-span-3 space-y-8">
              {/* 分类切换器 */}
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-4">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    selectedCategory === 'all'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Globe size={15} />
                  <span>全部内容</span>
                </button>
                <button
                  onClick={() => setSelectedCategory('blog')}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    selectedCategory === 'blog'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Terminal size={15} />
                  <span>运维实战</span>
                </button>
                <button
                  onClick={() => setSelectedCategory('ai-news')}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    selectedCategory === 'ai-news'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Newspaper size={15} />
                  <span>AI早报 & 新闻推送</span>
                </button>
              </div>

              {/* 过滤提示 */}
              {(selectedTag || searchQuery) && (
                <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl flex items-center justify-between text-sm text-slate-700">
                  <div className="flex items-center space-x-2">
                    <span>当前过滤条件：</span>
                    {selectedTag && (
                      <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-md font-semibold text-xs border border-indigo-200 flex items-center space-x-1">
                        <TagIcon size={10} />
                        <span>标签: {selectedTag}</span>
                      </span>
                    )}
                    {searchQuery && (
                      <span className="bg-slate-200 text-slate-800 px-2.5 py-1 rounded-md font-semibold text-xs border border-slate-300">
                        关键字: "{searchQuery}"
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => { setSelectedTag(null); setSearchQuery(''); }}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    清除过滤
                  </button>
                </div>
              )}

              {/* 文章列表 */}
              {filteredPosts.length > 0 ? (
                <div className="space-y-6">
                  {filteredPosts.map(post => (
                    <article 
                      key={post.id} 
                      className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:border-slate-300 transition-all duration-300 group cursor-pointer"
                      onClick={() => selectPost(post.id)}
                    >
                      <div className="flex items-center space-x-2 mb-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                          post.category === 'ai-news'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        }`}>
                          {post.category === 'ai-news' ? '每日AI日报' : '运维博客'}
                        </span>
                        <div className="flex items-center text-slate-400 text-xs space-x-1">
                          <Calendar size={12} className="ml-2" />
                          <span>{post.date}</span>
                        </div>
                      </div>

                      <h2 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors duration-200 mb-3 line-clamp-2">
                        {post.title}
                      </h2>
                      
                      <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">
                        {post.summary}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map(tag => (
                            <span 
                              key={tag} 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTagClick(tag);
                              }}
                              className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border transition-all duration-200 hover:bg-indigo-500 hover:text-white ${
                                selectedTag === tag 
                                  ? 'bg-indigo-500 text-white border-indigo-600' 
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-500'
                              }`}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <span className="inline-flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-800 transition-all duration-200">
                          阅读全文
                          <ChevronRight size={16} className="ml-0.5 transform group-hover:translate-x-1 transition-transform duration-200" />
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl py-16 px-4 text-center">
                  <div className="text-slate-300 mb-4 flex justify-center">
                    <Terminal size={48} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-700 mb-2">未找到匹配文章</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">
                    试试更换搜索词，或者选择其他的分类或标签进行检索。
                  </p>
                  <button
                    onClick={() => { setSelectedTag(null); setSelectedCategory('all'); setSearchQuery(''); }}
                    className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md shadow-indigo-600/10 transition-all duration-200"
                  >
                    查看全部内容
                  </button>
                </div>
              )}
            </div>

            {/* 右侧小挂件边栏 */}
            <div className="space-y-8">
              {/* 站长卡片 */}
              <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-2xl opacity-30 -translate-y-8 translate-x-8"></div>
                <div className="flex items-center space-x-3 mb-4 relative z-10">
                  <div className="bg-indigo-500/10 border border-indigo-500/30 p-2.5 rounded-xl text-indigo-400">
                    <Terminal size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base">OpsTech Notes</h3>
                    <p className="text-xs text-slate-400">运维技术博客</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4 relative z-10">
                  这是由 AI 自动化管理的运维技术博客。每日由自动化流水线爬取最新 AI 运维资讯，并由大模型进行深度摘要整理推送。
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400 relative z-10">
                  <span className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    更新频率：每日推送
                  </span>
                  <a 
                    href="#github" 
                    onClick={(e) => { e.preventDefault(); setCurrentPage('about'); }} 
                    className="text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    了解更多
                  </a>
                </div>
              </div>

              {/* 热门标签 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h3 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-100 flex items-center space-x-1.5">
                  <TagIcon size={14} className="text-indigo-600" />
                  <span>热门标签分类</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(tagCounts).map(([tag, count]) => (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md border flex items-center space-x-1 transition-all duration-200 ${
                        selectedTag === tag
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/10'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50'
                      }`}
                    >
                      <span>#{tag}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        selectedTag === tag ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 每日 AI 简报入口 */}
              <div className="bg-gradient-to-tr from-amber-500/10 to-orange-500/5 border border-amber-200/50 rounded-2xl p-6">
                <div className="flex items-center space-x-2 text-amber-800 font-bold mb-3 text-sm">
                  <TrendingUp size={16} />
                  <span>AI 日报推送订阅</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  自动化定时任务会将每天的 AI 与云原生技术早报发布至本博客，方便运维同仁随时查阅前沿动态。
                </p>
                <button
                  onClick={() => setSelectedCategory('ai-news')}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/10 transition-all duration-200 flex items-center justify-center space-x-1.5 mb-2"
                >
                  <Newspaper size={12} />
                  <span>查看日报列表</span>
                </button>
                <a
                  href="/news-html/"
                  className="w-full py-2 bg-white/80 hover:bg-white border border-amber-300 hover:border-amber-500 text-amber-700 hover:text-amber-900 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 flex items-center justify-center space-x-1.5"
                >
                  <Globe size={12} />
                  <span>原始 HTML 日报归档</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* 文章详情页 */}
        {currentPage === 'post' && currentPost && (
          <div className="max-w-3xl mx-auto">
            {/* 返回按钮 */}
            <button
              onClick={navigateToHome}
              className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors duration-200 mb-8 font-semibold text-sm"
            >
              <ArrowLeft size={16} />
              <span>返回列表页</span>
            </button>

            {/* 文章头部 */}
            <header className="mb-8 pb-8 border-b border-slate-200">
              <div className="flex items-center space-x-3 mb-4">
                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                  currentPost.category === 'ai-news'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}>
                  {currentPost.category === 'ai-news' ? '每日AI早报' : '技术博客'}
                </span>
                <div className="flex items-center text-slate-400 text-xs space-x-1">
                  <Calendar size={12} />
                  <span>发布于 {currentPost.date}</span>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
                {currentPost.title}
              </h1>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2">
                {currentPost.tags.map(tag => (
                  <span 
                    key={tag} 
                    onClick={() => handleTagClick(tag)}
                    className="inline-flex items-center text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-500 rounded-md text-slate-600 hover:text-indigo-600 transition-colors duration-200 cursor-pointer"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </header>

            {/* Markdown 渲染主体 */}
            <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm mb-12">
              <MarkdownRenderer content={currentPost.content} />
            </article>

            {/* 关于站长的小卡片 */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="bg-slate-950 p-3 rounded-xl text-indigo-400 self-center">
                <Terminal size={24} />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-slate-500 text-xs leading-relaxed mb-2">
                  本博客主要发布有关高可用集群搭建、DevOps 自动化运维脚本和 CDN/Nginx 服务调优。
                  欢迎通过自动化任务每日同步查看我们推送的新闻。
                </p>
                <div className="flex items-center justify-center sm:justify-start space-x-4">
                  <button 
                    onClick={() => setCurrentPage('about')}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors duration-200"
                  >
                    关于博客与自动化任务
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 关于页面 */}
        {currentPage === 'about' && (
          <div className="max-w-3xl mx-auto">
            {/* 返回首页 */}
            <button
              onClick={navigateToHome}
              className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-colors duration-200 mb-8 font-semibold text-sm"
            >
              <ArrowLeft size={16} />
              <span>返回首页</span>
            </button>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
              {/* 头图/简介 */}
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 pb-6 border-b border-slate-100">
                <div className="bg-gradient-to-tr from-slate-950 to-indigo-900 p-5 rounded-2xl text-indigo-300">
                  <Terminal size={48} className="animate-pulse" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-3xl font-extrabold text-slate-900 mb-2">关于本博客网站</h1>
                  <p className="text-slate-500 text-sm">SRE 自动化运维实战与 AI 科技简报发布中心</p>
                </div>
              </div>

              {/* 核心价值 */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Award size={18} className="text-indigo-600" />
                  <span>关于站长 & 博客使命</span>
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  本博客主要记录企业 IT 和自动化开发负责人在管理大型基础设施、高可用 Kubernetes 集群以及复杂网络系统时的生产实战手记。
                  我们专注于以下三个技术方向：
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <div className="text-indigo-600 font-extrabold text-sm mb-2">DevOps 自动化</div>
                    <div className="text-slate-500 text-xs leading-relaxed">
                      基于 Playwright、Ansible 及 CMDB 系统开发的 SSL 证书自动重签与分发等核心自动化工具，实现零人工介入运维。
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <div className="text-indigo-600 font-extrabold text-sm mb-2">系统与网络优化</div>
                    <div className="text-slate-500 text-xs leading-relaxed">
                      针对大流量官网的 Nginx 缓存优化、CDN 缓存命中率调优、网络流量限制与 IPv6 网络安全运维。
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                    <div className="text-indigo-600 font-extrabold text-sm mb-2">AIOps 日报推送</div>
                    <div className="text-slate-500 text-xs leading-relaxed">
                      借助自动化流水线每日定时推送 AI 及云原生智能运维早报，让运维工程实践与前沿科技同频共振。
                    </div>
                  </div>
                </div>
              </div>

              {/* 关于自动化推送系统 */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
                  <Cpu size={18} className="text-amber-600" />
                  <span>每日 AI 新闻自动化推送说明</span>
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  本博客集成了一套成熟的 AI 新闻抓取与推送流水线。系统每天早晨由自动化任务自动执行，流程如下：
                </p>
                <ol className="list-decimal pl-6 space-y-2 text-slate-600 text-sm">
                  <li>
                    <strong>内容抓取</strong>：自动化脚本使用网络爬虫或 RSS Feeds 检索前沿 AIOps、AI 编程和科技新闻；
                  </li>
                  <li>
                    <strong>模型摘要</strong>：基于 Claude / DeepMind 先进模型进行内容摘要、分类与标签判定，生成易读的 Markdown 文本；
                  </li>
                  <li>
                    <strong>直接推送</strong>：自动化流水线自动更新博客底层的 `posts.ts` 数据源文件，执行生产环境 `build` 并在完成后通过腾讯云静态网页托管直接发布。
                  </li>
                </ol>
                <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-xl text-amber-800 text-xs leading-relaxed flex items-start space-x-2">
                  <ShieldAlert size={16} className="mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>安全性与稳定性</strong>：所有抓取源经过白名单认证，推送任务仅限于项目特定的 `ai-news` 分类下。同时我们部署了防抖缓存方案，高并发下依然能够完美维持 95% 以上的静态命中率。
                  </span>
                </div>
              </div>

              {/* 社交/链接 */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
                <div className="flex items-center space-x-4">
                  <a href="#github" onClick={(e) => e.preventDefault()} className="flex items-center hover:text-slate-900 transition-colors">
                    <Github size={14} className="mr-1" />
                    GitHub Organization
                  </a>
                </div>
                <span>© 2026 OpsTech Notes. All rights reserved.</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 底部通栏 */}
      <footer className="bg-slate-900 text-slate-400 py-10 border-t border-slate-800">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-6 text-sm">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-lg text-indigo-400">
              <Terminal size={16} />
            </div>
            <div>
              <span className="text-white font-bold text-base">OpsTech Notes</span>
              <p className="text-xs text-slate-500 mt-0.5">SRE & DevOps & AIOps 自动化技术博客</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-xs sm:text-sm">
            <button onClick={navigateToHome} className="hover:text-white transition-colors">首页博客</button>
            <button onClick={() => setSelectedCategory('blog')} className="hover:text-white transition-colors">运维实战</button>
            <button onClick={() => setSelectedCategory('ai-news')} className="hover:text-white transition-colors">AI早报</button>
            <a href="/news-html/" className="hover:text-white transition-colors">日报归档</a>
            <button onClick={() => setCurrentPage('about')} className="hover:text-white transition-colors">关于本站</button>
          </div>

          <div className="text-xs text-slate-500">
            <span>© 2026 OpsTech Notes. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
