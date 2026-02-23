import React, { useState, useRef, useEffect, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { generateQuestions, analyzePerformance, analyzePaper } from '../services/geminiService';
import { Subject, GradeLevel, TextbookVersion, Question, Answer, DiagnosticReport } from '../types';

interface DiagnosticSessionProps {
  onComplete: (report: DiagnosticReport, subject: Subject, version: TextbookVersion, studentName: string) => void;
  onCancel: () => void;
}

const MAX_IMAGES = 10;

const DiagnosticSession: React.FC<DiagnosticSessionProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<'setup' | 'loading' | 'testing' | 'analyzing'>('setup');
  const [loadingMessage, setLoadingMessage] = useState('AI 正在准备中...');
  const [method, setMethod] = useState<'quiz' | 'paper'>('quiz');
  
  const [studentName, setStudentName] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.MATH);
  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>(GradeLevel.SENIOR_1);
  const [selectedVersion, setSelectedVersion] = useState<TextbookVersion>(TextbookVersion.SU_JIAO);
  
  // Quiz State
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Paper State - Array for multiple images
  const [paperImages, setPaperImages] = useState<string[]>([]);
  
  // Cropping State
  const [croppingIndex, setCroppingIndex] = useState<number | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Loading Message Cycle
  useEffect(() => {
    if (step === 'loading' || step === 'analyzing') {
      const messages = step === 'loading' 
        ? ["连接 AI 知识库...", `检索${selectedVersion}考纲...`, "根据年级调整难度...", "生成个性化题目..."]
        : ["识别答题内容...", `比对${selectedVersion}知识点...`, "分析各页数据关联性...", "构建全方位评价..."];
      
      let i = 0;
      setLoadingMessage(messages[0]);
      const interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setLoadingMessage(messages[i]);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [step, selectedVersion]);

  const startTest = async () => {
    setStep('loading');
    try {
      const qs = await generateQuestions(selectedSubject, selectedGrade, selectedVersion);
      setQuestions(qs);
      setStep('testing');
    } catch (error) {
      console.error(error);
      alert("生成题目失败，请检查配置。");
      setStep('setup');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - paperImages.length;
    const filesToProcess = files.slice(0, remaining);

    if (files.length > remaining) {
      alert(`最多只能上传 ${MAX_IMAGES} 张图片，已为您添加前 ${remaining} 张。`);
    }

    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaperImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setPaperImages(prev => prev.filter((_, i) => i !== index));
  };

  // Cropping logic
  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const handleDoneCropping = async () => {
    if (croppingIndex === null || !croppedAreaPixels) return;

    try {
      const image = await createImage(paperImages[croppingIndex]);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return;

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        croppedAreaPixels.width,
        croppedAreaPixels.height
      );

      const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
      setPaperImages((prev) => {
        const next = [...prev];
        next[croppingIndex] = croppedImage;
        return next;
      });
      setCroppingIndex(null);
    } catch (e) {
      console.error(e);
      alert('裁剪失败，请重试');
    }
  };

  const startCamera = async () => {
    if (paperImages.length >= MAX_IMAGES) {
      alert(`已达到最大图片限制 (${MAX_IMAGES}张)`);
      return;
    }
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("无法访问摄像头，请检查权限设置或尝试使用文件上传。");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPaperImages(prev => [...prev, dataUrl]);
        
        if (paperImages.length + 1 >= MAX_IMAGES) {
          stopCamera();
          alert("已达到最大连拍上限。");
        }
      }
    }
  };

  const handleAnalyzePaper = async () => {
    if (paperImages.length === 0) return;
    setStep('analyzing');
    try {
      const report = await analyzePaper(selectedSubject, selectedGrade, selectedVersion, paperImages);
      onComplete(report, selectedSubject, selectedVersion, studentName);
    } catch (error) {
      console.error(error);
      alert("图片分析失败，请重试。");
      setStep('setup');
    }
  };

  const handleNext = () => {
    if (!currentInput.trim()) return;
    setIsTransitioning(true);
    const newAnswer: Answer = {
      questionId: questions[currentQuestionIndex].id,
      userResponse: currentInput
    };
    
    setTimeout(() => {
      const newAnswers = [...answers, newAnswer];
      setAnswers(newAnswers);
      setCurrentInput('');
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setIsTransitioning(false);
      } else {
        finishTest(newAnswers);
      }
    }, 300);
  };

  const finishTest = async (finalAnswers: Answer[]) => {
    setStep('analyzing');
    try {
      const report = await analyzePerformance(selectedSubject, selectedGrade, selectedVersion, questions, finalAnswers);
      onComplete(report, selectedSubject, selectedVersion, studentName);
    } catch (error) {
      console.error(error);
      alert("分析失败，请重试。");
      setStep('setup');
    }
  };

  if (step === 'setup') {
    return (
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-14 rounded-[2rem] shadow-card border border-gray-100 mt-10 animate-scale-in origin-bottom overflow-hidden">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">配置诊断参数</h2>
          <p className="text-gray-500 text-base">输入姓名并选择适合你的设置</p>
        </div>

        <div className="mb-10">
          <label className="block text-base font-bold text-gray-700 mb-4 px-1">学生姓名</label>
          <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
               <svg className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             </div>
             <input
               type="text"
               value={studentName}
               onChange={(e) => setStudentName(e.target.value)}
               placeholder="请输入姓名（默认为同学）"
               className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-700 font-medium placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-brand-50 focus:border-brand-500 focus:bg-white transition-all"
             />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-10">
          <button 
            className={`p-6 rounded-2xl border-2 transition-all duration-300 ease-out flex flex-col items-center justify-center space-y-4 group
              ${method === 'quiz' ? 'border-brand-500 bg-brand-50/50 shadow-md transform scale-[1.02]' : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50'}`}
            onClick={() => setMethod('quiz')}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ${method === 'quiz' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <div className="text-center">
              <div className={`font-bold text-lg mb-1 transition-colors ${method === 'quiz' ? 'text-brand-700' : 'text-gray-700'}`}>在线测试</div>
              <div className="text-sm text-gray-400">AI 智能出题</div>
            </div>
          </button>
          
          <button 
            className={`p-6 rounded-2xl border-2 transition-all duration-300 ease-out flex flex-col items-center justify-center space-y-4 group
              ${method === 'paper' ? 'border-brand-500 bg-brand-50/50 shadow-md transform scale-[1.02]' : 'border-gray-100 hover:border-gray-200 bg-white hover:bg-gray-50'}`}
            onClick={() => setMethod('paper')}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ${method === 'paper' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </div>
            <div className="text-center">
              <div className={`font-bold text-lg mb-1 transition-colors ${method === 'paper' ? 'text-brand-700' : 'text-gray-700'}`}>拍照诊断</div>
              <div className="text-sm text-gray-400">支持上传多页</div>
            </div>
          </button>
        </div>

        <div className="space-y-10">
          <div>
            <label className="block text-base font-bold text-gray-700 mb-4 px-1">教材版本</label>
            <div className="grid grid-cols-4 gap-4">
              {Object.values(TextbookVersion).map((ver) => (
                <button
                  key={ver}
                  onClick={() => setSelectedVersion(ver)}
                  className={`py-3 px-2 rounded-xl text-sm transition-all duration-200 border font-medium truncate active:scale-95
                    ${selectedVersion === ver
                      ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-200' 
                      : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'}`}
                >
                  {ver}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-700 mb-4 px-1">选择年级</label>
            <div className="grid grid-cols-3 gap-4">
              {Object.values(GradeLevel).map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`py-4 px-4 rounded-xl text-base transition-all duration-200 border font-medium active:scale-95
                    ${selectedGrade === grade 
                      ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-200' 
                      : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'}`}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-700 mb-4 px-1">选择学科</label>
            <div className="grid grid-cols-4 gap-4">
              {Object.values(Subject).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`py-4 px-2 rounded-xl text-base transition-all duration-200 border font-medium truncate active:scale-95
                    ${selectedSubject === sub 
                      ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-200' 
                      : 'bg-white border-gray-100 text-gray-600 hover:bg-gray-50 hover:border-gray-200'}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {method === 'paper' && (
            <div className="mt-8 animate-fade-in">
              <div className="flex justify-between items-center mb-4 px-1">
                <label className="block text-base font-bold text-gray-700">上传试卷</label>
                <span className="text-sm font-medium text-gray-400">
                  {paperImages.length} / {MAX_IMAGES} 张
                </span>
              </div>
              
              {isCameraOpen && (
                <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in">
                  <div className="relative w-full max-w-2xl bg-black rounded-2xl overflow-hidden flex-1 flex items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline className="max-w-full max-h-full object-contain"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="absolute top-6 left-6 bg-brand-500 text-white px-4 py-2 rounded-full font-bold shadow-lg animate-pulse">
                      连拍模式: {paperImages.length}
                    </div>
                  </div>
                  <div className="h-32 w-full flex items-center justify-around pb-8 pt-6">
                    <button onClick={stopCamera} className="text-white bg-gray-800/80 backdrop-blur-sm px-8 py-4 rounded-full font-medium active:bg-gray-700 transition-colors text-lg">完成</button>
                    <button onClick={capturePhoto} disabled={paperImages.length >= MAX_IMAGES} className={`w-24 h-24 rounded-full border-4 shadow-xl active:scale-95 transition-transform flex items-center justify-center ${paperImages.length >= MAX_IMAGES ? 'bg-gray-600 border-gray-700' : 'bg-white border-gray-300'}`}>
                      <div className={`w-20 h-20 rounded-full border-2 ${paperImages.length >= MAX_IMAGES ? 'border-gray-500' : 'border-gray-200'}`}></div>
                    </button>
                    <div className="w-24"></div>
                  </div>
                </div>
              )}

              {croppingIndex !== null && (
                <div className="fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fade-in">
                  <div className="relative w-full max-w-4xl flex-1 bg-white/5 rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-8">
                    <Cropper
                      image={paperImages[croppingIndex]}
                      crop={crop}
                      zoom={zoom}
                      aspect={undefined} // Free aspect ratio for varied paper sizes
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      style={{
                        containerStyle: { backgroundColor: '#111827' },
                      }}
                    />
                  </div>
                  <div className="w-full max-w-xl flex flex-col gap-6">
                    {/* Zoom Slider */}
                    <div className="px-10">
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-500"
                      />
                    </div>
                    <div className="flex gap-4">
                      <button 
                        onClick={() => setCroppingIndex(null)} 
                        className="flex-1 py-4 px-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all"
                      >
                        取消裁剪
                      </button>
                      <button 
                        onClick={handleDoneCropping} 
                        className="flex-1 py-4 px-6 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl font-bold shadow-xl shadow-brand-500/20 active:scale-95 transition-all"
                      >
                        确认裁剪
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {paperImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 animate-fade-in">
                    {paperImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden group shadow-sm border border-gray-200 hover:border-brand-200 transition-all">
                        <img src={img} alt={`Page ${idx+1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                           <div className="flex gap-2">
                            <button 
                              onClick={() => setCroppingIndex(idx)} 
                              className="bg-brand-500 text-white p-2 rounded-lg shadow-lg hover:scale-110 active:scale-95 transition-transform"
                              title="裁剪图片"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7 7m-7-7l1.414-1.414M5 19V5h14v4"></path></svg>
                            </button>
                            <button 
                              onClick={() => removeImage(idx)} 
                              className="bg-red-500 text-white p-2 rounded-lg shadow-lg hover:scale-110 active:scale-95 transition-transform"
                              title="移除图片"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                           </div>
                        </div>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">P{idx + 1}</div>
                      </div>
                    ))}
                    {paperImages.length < MAX_IMAGES && (
                      <div className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 hover:bg-brand-50/30 hover:border-brand-200 transition-all group cursor-pointer relative overflow-hidden">
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-2 text-gray-400 group-hover:text-brand-500 transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        </div>
                        <span className="text-xs font-bold text-gray-400 group-hover:text-brand-600">添加</span>
                      </div>
                    )}
                  </div>
                )}

                {paperImages.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-[1.5rem] p-10 bg-gray-50 hover:bg-brand-50/30 hover:border-brand-200 transition-colors relative min-h-[300px] flex flex-col items-center justify-center gap-6 group">
                    <div className="w-20 h-20 bg-white border border-gray-200 text-gray-400 rounded-3xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300 group-hover:border-brand-200 group-hover:text-brand-500">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                      <div className="relative flex-1">
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <button className="w-full bg-white border border-gray-200 text-gray-700 py-4 px-6 rounded-2xl font-bold shadow-sm hover:bg-gray-50 hover:text-brand-600 transition-colors flex items-center justify-center text-lg">
                          <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                          选择图片
                        </button>
                      </div>
                      <button onClick={startCamera} className="flex-1 bg-brand-500 text-white py-4 px-6 rounded-2xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-600 transition-colors flex items-center justify-center active:scale-95 text-lg">
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        拍照识别
                      </button>
                    </div>
                  </div>
                )}
                {paperImages.length > 0 && (
                   <div className="flex gap-4">
                     <div className="relative flex-1">
                        <input type="file" multiple accept="image/*" disabled={paperImages.length >= MAX_IMAGES} onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
                        <button disabled={paperImages.length >= MAX_IMAGES} className="w-full bg-white border border-gray-200 text-gray-600 py-3 px-4 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center disabled:opacity-50">继续添加</button>
                      </div>
                      <button onClick={startCamera} disabled={paperImages.length >= MAX_IMAGES} className="flex-1 bg-brand-50 text-brand-600 py-3 px-4 rounded-xl font-bold border border-brand-100 hover:bg-brand-100 transition-colors flex items-center justify-center active:scale-95 disabled:opacity-50">继续拍照</button>
                   </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-10 flex space-x-6">
            <button onClick={onCancel} className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 rounded-2xl transition-colors text-base active:scale-95">取消</button>
            {method === 'quiz' ? (
              <button onClick={startTest} className="flex-1 py-4 bg-brand-500 text-white font-bold rounded-2xl hover:bg-brand-600 transition-all text-base shadow-lg shadow-brand-200 active:scale-95">生成题目</button>
            ) : (
              <button onClick={handleAnalyzePaper} disabled={paperImages.length === 0} className={`flex-1 py-4 font-bold rounded-2xl transition-all text-base shadow-lg ${paperImages.length > 0 ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-brand-200 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 shadow-none'}`}>开始智能分析</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'loading' || step === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] animate-fade-in">
        <div className="relative w-32 h-32 mb-10">
           <div className="absolute inset-0 bg-brand-100 rounded-full animate-ping opacity-20"></div>
           <div className="absolute inset-2 border-[4px] border-gray-100 rounded-full"></div>
           <div className="absolute inset-2 border-[4px] border-brand-500 rounded-full border-t-transparent animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center"><span className="text-5xl animate-bounce">✨</span></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">{step === 'loading' ? '正在生成诊断内容' : '正在分析学情数据'}</h3>
        <p className="text-brand-500 font-medium text-lg bg-brand-50 px-6 py-2 rounded-full transition-all duration-300">{loadingMessage}</p>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto mt-10 animate-slide-up-fade">
      <div className="mb-10">
        <div className="flex justify-between text-sm text-gray-500 mb-3 font-bold tracking-wide">
          <span>题目 {currentQuestionIndex + 1} / {questions.length}</span>
          <span>{Math.round(progress)}% 完成</span>
        </div>
        <div className="h-3.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-brand-500 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) rounded-full shadow-[0_0_12px_rgba(51,112,255,0.4)] relative" style={{ width: `${Math.max(5, progress)}%` }}>
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className={`bg-white p-10 md:p-14 rounded-[2.5rem] shadow-card border border-gray-100 transition-all duration-500 ease-out transform ${isTransitioning ? 'opacity-0 translate-y-8 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
        <div className="flex items-center space-x-4 mb-10">
          <span className="bg-brand-50 text-brand-600 text-sm font-bold px-4 py-2 rounded-xl border border-brand-100">{currentQ.topic}</span>
          <span className="text-sm text-gray-400 uppercase tracking-wide font-medium">{currentQ.type === 'multiple_choice' ? '单选题' : '简答题'}</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-12 leading-relaxed">{currentQ.text}</h3>
        {currentQ.type === 'multiple_choice' && currentQ.options && (
          <div className="space-y-5 mb-12">
            {currentQ.options.map((opt, idx) => (
              <button key={idx} onClick={() => setCurrentInput(opt)} className={`w-full text-left px-8 py-6 rounded-3xl border-2 transition-all duration-300 text-lg group relative overflow-hidden active:scale-[0.99] ${currentInput === opt ? 'border-brand-500 bg-brand-50/30 text-brand-700 shadow-md' : 'border-gray-100 hover:border-brand-200 hover:bg-gray-50 text-gray-700'}`}>
                <div className="relative z-10 flex items-center">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold mr-6 transition-colors duration-300 ${currentInput === opt ? 'bg-brand-500 text-white shadow-lg shadow-brand-200' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'}`}>{String.fromCharCode(65 + idx)}</div>
                   <span className={`font-medium transition-colors duration-300 ${currentInput === opt ? 'text-gray-900' : 'text-gray-600'}`}>{opt}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        {currentQ.type === 'short_answer' && (
          <textarea value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} placeholder="请输入你的答案..." className="w-full h-56 p-8 rounded-3xl border-2 border-gray-100 focus:border-brand-500 focus:ring-4 focus:ring-brand-50 outline-none resize-none mb-12 text-lg transition-all duration-300 bg-gray-50 focus:bg-white placeholder-gray-400" />
        )}
        <div className="flex justify-end pt-10 border-t border-gray-50">
          <button onClick={handleNext} disabled={!currentInput.trim()} className={`px-12 py-4 rounded-2xl font-bold text-base transition-all duration-300 transform ${currentInput.trim() ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-xl shadow-brand-200 hover:-translate-y-1 active:scale-95' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            {currentQuestionIndex === questions.length - 1 ? '完成诊断' : '下一题'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticSession;