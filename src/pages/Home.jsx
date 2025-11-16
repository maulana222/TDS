import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ExcelUpload from '../components/ExcelUpload';
import ManualInput from '../components/ManualInput';
import ConfigForm from '../components/ConfigForm';
import TransactionMonitor from '../components/TransactionMonitor';
import ExcelPreview from '../components/ExcelPreview';
import FilterForm from '../components/FilterForm';
import { parseExcelFile } from '../services/excelService';
import { processTransactions } from '../services/transactionService';
import { exportToExcel } from '../services/excelService';
import { saveTransactionHistory } from '../utils/storage';
import { 
  generateBatchId, 
  createBatch, 
  updateBatch, 
  saveTransactions as saveTransactionsToDB,
  getTransactions
} from '../services/transactionApi';
import { deleteAllTransactions, deleteTransactionById } from '../services/deleteApi';
import { 
  initSocket, 
  disconnectSocket, 
  onTransactionUpdate, 
  onBatchUpdate,
  joinBatchRoom 
} from '../services/socketService';
import { getCurrentUser } from '../services/authService';

function Home() {
  const [transactions, setTransactions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [remainingTransactions, setRemainingTransactions] = useState([]);
  const [config, setConfig] = useState({
    delay: 0
  });
  const [inputMode, setInputMode] = useState('excel'); // 'excel' or 'manual'
  const cancelTokenRef = useRef({ cancelled: false });
  const notifiedRefs = useRef(new Set()); // Track ref_id yang sudah di-notify
  const [loadingFromDB, setLoadingFromDB] = useState(false);
  
  // Pagination & Filter state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    customerNo: '',
    productCode: ''
  });

  // Load transactions dari database saat page berubah
  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);
  
  // Load transactions saat filter berubah (reset ke page 1)
  useEffect(() => {
    if (pagination.page === 1) {
      loadTransactions();
    } else {
      // Reset to page 1 when filter changes
      setPagination(prev => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.status, filters.customerNo, filters.productCode]);

  const loadTransactions = async (resetPage = false) => {
    try {
      setLoadingFromDB(true);
      
      // Build filter object
      const filterParams = {};
      
      // Date filter - hanya set jika user memilih tanggal
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        filterParams.start_date = startDate.toISOString();
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filterParams.end_date = endDate.toISOString();
      } else if (filters.startDate) {
        // If start date is set but end date is not, use start date as end date
        const endDate = new Date(filters.startDate);
        endDate.setHours(23, 59, 59, 999);
        filterParams.end_date = endDate.toISOString();
      }
      
      // Status filter
      if (filters.status === 'success') {
        filterParams.success = 'true';
      } else if (filters.status === 'failed') {
        filterParams.success = 'false';
      }
      
      // Customer number filter
      if (filters.customerNo) {
        filterParams.customer_no = filters.customerNo;
      }
      
      // Product code filter
      if (filters.productCode) {
        filterParams.product_code = filters.productCode;
      }

      const currentPage = resetPage ? 1 : pagination.page;
      const response = await getTransactions(
        filterParams,
        {
          page: currentPage,
          limit: pagination.limit
        }
      );

      if (response.success && response.data) {
        // Convert database format ke format results
        const dbResults = response.data.map(tx => ({
          id: tx.id,
          ref_id: tx.ref_id,
          customer_no: tx.customer_no,
          customer_no_used: tx.customer_no_used,
          product_code: tx.product_code,
          success: tx.success,
          status: tx.status_code,
          data: tx.response_data,
          error: tx.error_message,
          rawResponse: tx.raw_response,
          row_number: tx.row_number,
          responseTime: tx.response_time,
          timestamp: tx.created_at
        }));

        // Sort berdasarkan timestamp terbaru di atas
        const sortedResults = dbResults.sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeB - timeA; // DESC: terbaru di atas
        });
        
        setResults(sortedResults);
        
        // Update pagination
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            page: response.pagination.page || currentPage,
            total: response.pagination.total || 0,
            totalPages: Math.ceil((response.pagination.total || 0) / pagination.limit)
          }));
        }
        
        console.log(`Loaded ${dbResults.length} transactions from database (page ${currentPage})`);
      }
    } catch (error) {
      console.error('Error loading transactions from database:', error);
      toast.error('Gagal memuat data dari database');
    } finally {
      setLoadingFromDB(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Reset to page 1 when filter changes
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Setup Socket.IO untuk real-time updates (socket sudah di-init di App.jsx)
  useEffect(() => {
    // Listen untuk transaction updates
    const unsubscribeTransaction = onTransactionUpdate((updatedTransaction) => {
      console.log('Transaction updated via socket:', updatedTransaction);
      
      const refId = updatedTransaction.ref_id;
      const notificationKey = `${refId}_${updatedTransaction.success}_${updatedTransaction.status_code}`;
      
      // Update results jika ref_id match
      setResults(prevResults => {
        const index = prevResults.findIndex(r => r.ref_id === refId);
        
        if (index >= 0) {
          const existingResult = prevResults[index];
          
          // Check apakah status benar-benar berubah
          const statusChanged = 
            existingResult.success !== updatedTransaction.success ||
            existingResult.status !== updatedTransaction.status_code;
          
          // Update existing result
          const newResults = [...prevResults];
          newResults[index] = {
            ...newResults[index],
            success: updatedTransaction.success,
            status: updatedTransaction.status_code,
            data: updatedTransaction.response_data,
            error: updatedTransaction.error_message,
            rawResponse: updatedTransaction.raw_response,
            timestamp: updatedTransaction.updated_at || updatedTransaction.created_at || newResults[index].timestamp || new Date().toISOString()
          };
          
          // Sort berdasarkan timestamp terbaru di atas
          newResults.sort((a, b) => {
            const timeA = new Date(a.timestamp || 0).getTime();
            const timeB = new Date(b.timestamp || 0).getTime();
            return timeB - timeA; // DESC: terbaru di atas
          });
          
          // Show toast notification HANYA jika status berubah dan belum di-notify
          if (statusChanged && !notifiedRefs.current.has(notificationKey)) {
            notifiedRefs.current.add(notificationKey);
            
            if (updatedTransaction.success) {
              toast.success(`Transaksi ${refId} berhasil!`, {
                duration: 3000,
                id: `tx-${refId}` // ID untuk prevent duplicate
              });
            } else {
              toast.error(`Transaksi ${refId} gagal: ${updatedTransaction.error_message || 'Unknown error'}`, {
                duration: 4000,
                id: `tx-${refId}` // ID untuk prevent duplicate
              });
            }
          }
          
          return newResults;
        } else {
          // Jika transaction belum ada di results, tambahkan (dari callback)
          // Tapi hanya jika transaksi ini dari hari ini (untuk menghindari data lama)
          const newResult = {
            ref_id: refId,
            customer_no: updatedTransaction.customer_no,
            customer_no_used: updatedTransaction.customer_no_used,
            product_code: updatedTransaction.product_code,
            success: updatedTransaction.success,
            status: updatedTransaction.status_code,
            data: updatedTransaction.response_data,
            error: updatedTransaction.error_message,
            rawResponse: updatedTransaction.raw_response,
            row_number: updatedTransaction.row_number,
            timestamp: updatedTransaction.updated_at || updatedTransaction.created_at || new Date().toISOString()
          };
          
          // Check apakah transaksi ini dari hari ini
          const txDate = new Date(newResult.timestamp);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const isToday = txDate >= today;
          
          // Show toast notification HANYA jika belum di-notify
          if (!notifiedRefs.current.has(notificationKey)) {
            notifiedRefs.current.add(notificationKey);
            
            if (updatedTransaction.success) {
              toast.success(`Transaksi ${refId} berhasil! (Update dari callback)`, {
                duration: 3000,
                id: `tx-${refId}` // ID untuk prevent duplicate
              });
            } else {
              toast.error(`Transaksi ${refId} gagal: ${updatedTransaction.error_message || 'Unknown error'} (Update dari callback)`, {
                duration: 4000,
                id: `tx-${refId}` // ID untuk prevent duplicate
              });
            }
          }
          
          // Hanya tambahkan jika dari hari ini
          if (isToday) {
            const updated = [newResult, ...prevResults];
            // Sort berdasarkan timestamp terbaru di atas
            return updated.sort((a, b) => {
              const timeA = new Date(a.timestamp || 0).getTime();
              const timeB = new Date(b.timestamp || 0).getTime();
              return timeB - timeA; // DESC: terbaru di atas
            });
          } else {
            return prevResults;
          }
        }
      });
    });

    // Listen untuk batch updates
    const unsubscribeBatch = onBatchUpdate((updatedBatch) => {
      console.log('Batch updated via socket:', updatedBatch);
      // Bisa update batch statistics di sini jika perlu
    });

    // Cleanup saat unmount
    return () => {
      unsubscribeTransaction();
      unsubscribeBatch();
      // Jangan disconnect socket di sini, biarkan tetap connected
    };
  }, []); // Hanya run sekali saat mount

  // Update socket room saat batchId berubah
  useEffect(() => {
    if (currentBatchId) {
      joinBatchRoom(currentBatchId);
    }
  }, [currentBatchId]);

  const handleFileUpload = async (file) => {
    try {
      toast.loading('Memvalidasi dan membaca file Excel...', { id: 'upload' });
      
      const parsed = await parseExcelFile(file);
      
      // Tampilkan preview
      setPreviewData({
        preview: parsed.preview,
        allData: parsed.allData,
        totalRows: parsed.totalRows,
        fileName: parsed.fileName,
        fileSize: parsed.fileSize,
        transactions: parsed.transactions
      });
      setShowPreview(true);
      
      toast.dismiss('upload');
      toast.success(`File berhasil dibaca! ${parsed.totalRows} transaksi ditemukan`);
    } catch (error) {
      toast.dismiss('upload');
      toast.error(`Error: ${error.message}`);
    }
  };

  const handleManualGenerate = (manualTransactions) => {
    setTransactions(manualTransactions);
    setProgress(null);
    toast.success(`${manualTransactions.length} transaksi siap diproses`);
  };

  const handleConfirmPreview = () => {
    if (previewData) {
      setTransactions(previewData.transactions);
      // Jangan reset results, biarkan data dari database tetap ada
      setProgress(null);
      setShowPreview(false);
      setPreviewData(null);
      toast.success(`${previewData.totalRows} transaksi siap diproses`);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setPreviewData(null);
  };

  const handleStart = async (resume = false) => {
    // Jika resume, gunakan remaining transactions, jika tidak gunakan semua transactions
    const transactionsToProcess = resume ? remainingTransactions : transactions;
    
    if (transactionsToProcess.length === 0) {
      toast.error('Silakan input data terlebih dahulu (Excel atau Manual)');
      return;
    }

    // Reset cancel token
    cancelTokenRef.current = { cancelled: false };
    setIsPaused(false);
    
    setIsProcessing(true);
    
    // Generate batch ID jika baru mulai (bukan resume)
    let batchId = currentBatchId;
    if (!resume) {
      batchId = generateBatchId();
      setCurrentBatchId(batchId);
      // Jangan reset results, biarkan data dari database tetap ada
      // Data baru akan muncul di atas karena di-sort berdasarkan timestamp
      setProgress({ current: 0, total: transactions.length, progress: 0 });
      
      // Create batch di database
      try {
        await createBatch(batchId, transactions.length, config);
      } catch (error) {
        console.error('Error creating batch:', error);
        // Continue even if batch creation fails
      }
    } else {
      // Resume menggunakan batch ID yang sama
      batchId = currentBatchId;
      // Update progress untuk resume
      const processedCount = results.length;
      setProgress({ 
        current: processedCount, 
        total: transactions.length, 
        progress: (processedCount / transactions.length) * 100 
      });
    }

    const totalToProcess = transactionsToProcess.length;
    const startIndex = resume ? results.length : 0;
    
    toast.loading(
      resume 
        ? `Melanjutkan proses... ${totalToProcess} transaksi tersisa`
        : `Memproses ${totalToProcess} transaksi...`, 
      { id: 'processing' }
    );

    try {
      // Konversi delay dari detik ke milidetik
      const delayInMs = (config.delay || 0) * 1000;
      
      const transactionResults = await processTransactions(
        transactionsToProcess,
        async (progressData) => {
          // Update progress dengan offset jika resume
          const currentProgress = {
            current: startIndex + progressData.current,
            total: transactions.length,
            progress: ((startIndex + progressData.current) / transactions.length) * 100,
            result: progressData.result
          };
          setProgress(currentProgress);
          // Merge dengan existing results, pastikan tidak ada duplikasi
          // Data baru akan muncul di atas (terbaru di atas)
          setResults(prev => {
            if (!progressData.result || !progressData.result.ref_id) return prev;
            const existingIndex = prev.findIndex(r => r.ref_id === progressData.result.ref_id);
            if (existingIndex >= 0) {
              // Update existing
              const updated = [...prev];
              updated[existingIndex] = {
                ...progressData.result,
                timestamp: progressData.result.timestamp || new Date().toISOString()
              };
              // Sort berdasarkan timestamp terbaru di atas
              return updated.sort((a, b) => {
                const timeA = new Date(a.timestamp || 0).getTime();
                const timeB = new Date(b.timestamp || 0).getTime();
                return timeB - timeA; // DESC: terbaru di atas
              });
            } else {
              // Add new di awal array (terbaru di atas)
              const newResult = {
                ...progressData.result,
                timestamp: progressData.result.timestamp || new Date().toISOString()
              };
              const updated = [newResult, ...prev];
              // Sort berdasarkan timestamp terbaru di atas
              return updated.sort((a, b) => {
                const timeA = new Date(a.timestamp || 0).getTime();
                const timeB = new Date(b.timestamp || 0).getTime();
                return timeB - timeA; // DESC: terbaru di atas
              });
            }
          });
          
          // Simpan transaction ke database SEGERA setelah API call (tidak menunggu semua selesai)
          // Ini penting agar callback dari Digipro bisa menemukan transaction
          if (batchId && progressData.result && progressData.result.ref_id) {
            try {
              const transactionToSave = {
                customer_no: progressData.result.customer_no,
                customer_no_used: progressData.result.customer_no_used || progressData.result.customer_no,
                product_code: progressData.result.product_code,
                ref_id: progressData.result.ref_id,
                signature: '',
                status: progressData.result.status,
                success: progressData.result.success,
                responseTime: progressData.result.responseTime,
                data: progressData.result.data,
                error: progressData.result.error,
                rawResponse: progressData.result.rawResponse,
                row_number: progressData.result.row_number
              };
              
              await saveTransactionsToDB([transactionToSave], batchId);
              console.log(`Transaction ${progressData.result.ref_id} saved to database`);
            } catch (dbError) {
              console.error('Error saving transaction to database:', dbError);
              // Continue even if DB save fails
            }
          }
          
          // Update toast dengan progress
          if (currentProgress.current === currentProgress.total || cancelTokenRef.current.cancelled) {
            toast.dismiss('processing');
          }
        },
        delayInMs,
        cancelTokenRef.current
      );

      // Data sudah di-merge di dalam processTransactions callback via setResults
      // Hanya perlu memastikan data ter-sort dengan benar (terbaru di atas)
      setResults(prev => {
        // Sort berdasarkan timestamp terbaru di atas
        return [...prev].sort((a, b) => {
          const timeA = new Date(a.timestamp || 0).getTime();
          const timeB = new Date(b.timestamp || 0).getTime();
          return timeB - timeA; // DESC: terbaru di atas
        });
      });
      
      // Update remaining transactions
      if (cancelTokenRef.current.cancelled) {
        // Hitung sisa transaksi yang belum diproses
        // Hanya hitung transaksi dari batch ini (yang baru diproses)
        const batchResults = results.filter(r => r.ref_id && r.ref_id.startsWith(`ref_${batchId}`));
        const processedCount = batchResults.length;
        const remaining = transactions.slice(processedCount);
        setRemainingTransactions(remaining);
        setIsPaused(true);
        
        // Update batch status ke paused
        if (batchId) {
          try {
            await updateBatch(batchId, { status: 'paused' });
          } catch (error) {
            console.error('Error updating batch status:', error);
          }
        }
      } else {
        setRemainingTransactions([]);
        setIsPaused(false);
        
        // Update batch status ke completed
        if (batchId) {
          try {
            // Hitung transaksi dari batch ini saja
            const batchResults = results.filter(r => r.ref_id && r.ref_id.startsWith(`ref_${batchId}`));
            const successCount = batchResults.filter(r => r.success).length;
            const failedCount = batchResults.length - successCount;
            await updateBatch(batchId, {
              status: 'completed',
              successful_count: successCount,
              failed_count: failedCount,
              completed_at: new Date().toISOString()
            });
          } catch (error) {
            console.error('Error updating batch status:', error);
          }
        }
      }
      
      // Note: Transaction sudah disimpan ke database di dalam onProgress callback
      // untuk memastikan callback dari Digipro bisa menemukan transaction
      
      // Simpan history (localStorage backup)
      try {
        await saveTransactionHistory({
          transactions,
          results: finalResults,
          config,
          batch_id: batchId,
          timestamp: new Date().toISOString()
        });
      } catch (historyError) {
        console.error('Error saving history:', historyError);
      }

      // Notifikasi selesai
      if (cancelTokenRef.current.cancelled) {
        const processedCount = finalResults.length;
        const remainingCount = transactions.length - processedCount;
        toast.error(
          `Proses dihentikan. ${processedCount} dari ${transactions.length} transaksi sudah diproses. ${remainingCount} transaksi tersisa.`,
          { duration: 5000 }
        );
      } else {
        const successCount = finalResults.filter(r => r.success).length;
        const failedCount = finalResults.filter(r => !r.success).length;
        toast.success(
          `Selesai! ${successCount} berhasil, ${failedCount} gagal dari ${transactions.length} transaksi`,
          { duration: 5000 }
        );
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
      toast.dismiss('processing');
    }
  };

  const handleStop = () => {
    if (window.confirm('Apakah Anda yakin ingin menghentikan proses yang sedang berjalan? Anda bisa melanjutkannya nanti.')) {
      cancelTokenRef.current.cancelled = true;
      toast('Menghentikan proses...', { icon: '⏹️' });
    }
  };

  const handleResume = () => {
    if (remainingTransactions.length === 0) {
      toast.error('Tidak ada transaksi yang tersisa untuk dilanjutkan');
      return;
    }
    handleStart(true);
  };

  const handleExport = () => {
    if (results.length === 0) {
      toast.error('Tidak ada hasil untuk diekspor');
      return;
    }

    try {
      const exportData = results.map((r, idx) => ({
        'No': idx + 1,
        'Customer Number': r.customer_no,
        'Product Code': r.product_code,
        'Ref ID': r.ref_id || 'N/A',
        'Status': r.success ? (r.data?.status || 'Success') : 'Failed',
        'RC': r.data?.rc || 'N/A',
        'Balance': r.data?.balance || 'N/A',
        'Price': r.data?.price || 'N/A',
        'SN': r.data?.sn || 'N/A',
        'Message': r.data?.message || r.error || 'N/A',
        'Response Time (ms)': r.responseTime || 'N/A',
        'Timestamp': r.timestamp || 'N/A'
      }));

      exportToExcel(exportData, `transaction-results-${Date.now()}.xlsx`);
      toast.success('File Excel berhasil diekspor!');
    } catch (error) {
      toast.error(`Error saat export: ${error.message}`);
    }
  };

  const handleDeleteAllFromDB = async () => {
    if (!window.confirm('⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus SEMUA transaksi dari database?\n\nTindakan ini TIDAK DAPAT DIBATALKAN!')) {
      return;
    }

    // Double confirmation
    const confirmText = prompt('Ketik "HAPUS SEMUA" untuk konfirmasi:');
    if (confirmText !== 'HAPUS SEMUA') {
      toast.error('Konfirmasi dibatalkan');
      return;
    }

    try {
      const result = await deleteAllTransactions();
      toast.success(`Berhasil menghapus ${result.deleted_count} transaksi dari database`);
      
      // Clear local state
      setResults([]);
      setTransactions([]);
      setProgress({ current: 0, total: 0, progress: 0 });
      setCurrentBatchId(null);
      notifiedRefs.current.clear();
      
      // Reload transactions
      await loadTransactions(true);
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast.error(error.message || 'Gagal menghapus transaksi');
    }
  };

  const handleDeleteSingle = async (transactionId) => {
    try {
      toast.loading('Menghapus transaksi...', { id: 'delete-single' });
      const result = await deleteTransactionById(transactionId);
      toast.dismiss('delete-single');
      toast.success('Berhasil menghapus transaksi');
      
      // Remove from results
      setResults(prev => prev.filter(r => r.id !== transactionId));
      
      // Reload transactions
      await loadTransactions();
    } catch (error) {
      toast.dismiss('delete-single');
      console.error('Error deleting transaction:', error);
      toast.error(error.message || 'Gagal menghapus transaksi');
    }
  };

  const handleViewDetail = (transaction) => {
    const detail = `
Ref ID: ${transaction.ref_id || '-'}
Customer Number: ${transaction.customer_no || '-'}
Product Code: ${transaction.product_code || '-'}
Status: ${transaction.success ? '✅ Success' : '❌ Failed'}
RC: ${transaction.data?.rc || '-'}
Message: ${transaction.data?.message || transaction.error || '-'}
Response Time: ${transaction.responseTime ? `${transaction.responseTime}ms` : '-'}
Created At: ${transaction.timestamp ? new Date(transaction.timestamp).toLocaleString('id-ID') : '-'}
    `.trim();
    
    alert(detail);
  };

  const handleClearAll = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua data? File Excel, hasil transaksi, dan progress akan direset.')) {
      setTransactions([]);
      setCurrentBatchId(null);
      notifiedRefs.current.clear(); // Clear notifications saat reset
      setResults([]);
      setProgress(null);
      setConfig({ delay: 0 });
      setRemainingTransactions([]);
      setIsPaused(false);
      cancelTokenRef.current = { cancelled: false };
      
      // Reload transactions dari database hari ini setelah clear
      loadTransactions(true);
      
      toast.success('Semua data telah direset');
    }
  };

  const handleClearFile = () => {
    if (window.confirm('Hapus data yang sudah diinput?')) {
      setTransactions([]);
      setCurrentBatchId(null);
      notifiedRefs.current.clear(); // Clear notifications saat reset
      setProgress(null);
      setRemainingTransactions([]);
      setIsPaused(false);
      setShowPreview(false);
      setPreviewData(null);
      cancelTokenRef.current = { cancelled: false };
      
      // Reload transactions dari database hari ini setelah clear file
      // Tapi jangan reset results, biarkan data dari database tetap ada
      loadTransactions(true);
      
      toast.success('File Excel telah dihapus');
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-10 px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Transaction Request Tool</h1>
        <p className="text-gray-600 text-lg">Upload file Excel atau input manual untuk melakukan request transaksi</p>
      </div>

      {/* Main Content - Flexible Layout */}
      <div className="space-y-10">
        {/* Top Section - Upload & Config Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Step 1: Input Mode Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-gray-500">STEP 1</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Input Data</h2>
              <p className="text-sm text-gray-500 mt-1">Pilih metode input: Excel atau Manual</p>
            </div>

            {/* Tab Selection */}
            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => {
                  setInputMode('excel');
                  setTransactions([]);
                }}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  inputMode === 'excel'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                📊 Excel Upload
              </button>
              <button
                onClick={() => {
                  setInputMode('manual');
                  setTransactions([]);
                }}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2.5 rounded-md text-sm font-semibold transition-all ${
                  inputMode === 'manual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ✏️ Manual Input
              </button>
            </div>

            {/* Content berdasarkan mode */}
            {inputMode === 'excel' ? (
              <>
                <ExcelUpload onFileUpload={handleFileUpload} />
                {transactions.length > 0 && (
                  <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900 font-semibold">{transactions.length} transaksi</p>
                        <p className="text-gray-600 text-sm">Siap diproses</p>
                      </div>
                      <button
                        onClick={handleClearFile}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors"
                        disabled={isProcessing}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <ManualInput 
                  onGenerateTransactions={handleManualGenerate}
                  disabled={isProcessing}
                />
                {transactions.length > 0 && (
                  <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900 font-semibold">{transactions.length} transaksi</p>
                        <p className="text-gray-600 text-sm">Siap diproses</p>
                      </div>
                      <button
                        onClick={handleClearFile}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded transition-colors"
                        disabled={isProcessing}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Step 2: Konfigurasi */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-semibold text-gray-500">STEP 2</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Konfigurasi</h2>
              <p className="text-sm text-gray-500 mt-1">Atur delay antar request dan parameter lainnya</p>
            </div>
            
            <ConfigForm 
              config={config} 
              onChange={setConfig}
              disabled={isProcessing}
              transactions={transactions}
            />
          </div>
        </div>

        {/* Right Column - Monitor & Results (2/3 width) */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Header Section */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-semibold text-gray-500">STEP 3</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Monitor & Hasil</h2>
                  <p className="text-sm text-gray-500 mt-1">Pantau progress dan hasil transaksi real-time</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => loadTransactions()}
                  disabled={loadingFromDB}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh data dari database"
                >
                  {loadingFromDB ? 'Loading...' : 'Refresh'}
                </button>
                
                {isProcessing && (
                  <button
                    onClick={handleStop}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors"
                  >
                    Stop
                  </button>
                )}
                
                {isPaused && !isProcessing && remainingTransactions.length > 0 && (
                  <button
                    onClick={handleResume}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded-lg transition-colors"
                  >
                    Lanjutkan ({remainingTransactions.length})
                  </button>
                )}
                
                <button 
                  className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isProcessing || transactions.length === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                  onClick={() => handleStart(false)}
                  disabled={isProcessing || transactions.length === 0}
                >
                  {isProcessing ? 'Memproses...' : 'Mulai Request'}
                </button>
              </div>
            </div>
          </div>
      
          <div className="space-y-6">
            <FilterForm 
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={() => {
            setFilters({
              startDate: '',
              endDate: '',
              status: 'all',
              customerNo: '',
              productCode: ''
            });
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
        />
        
        <TransactionMonitor 
          progress={progress}
          results={results}
          isProcessing={isProcessing}
          isPaused={isPaused}
          remainingCount={remainingTransactions.length}
          pagination={pagination}
          onPageChange={handlePageChange}
          loading={loadingFromDB}
          onDelete={handleDeleteSingle}
          onViewDetail={handleViewDetail}
        />
        
            {/* Action Buttons */}
            {(results.length > 0 || transactions.length > 0) && (
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleClearAll}
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      disabled={isProcessing}
                    >
                      Reset Semua
                    </button>
                    <button
                      onClick={handleDeleteAllFromDB}
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      disabled={isProcessing}
                    >
                      Hapus dari Database
                    </button>
                  </div>
                  
                  {results.length > 0 && (
                    <button 
                      className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                      onClick={handleExport}
                    >
                      Export ke Excel
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Excel Preview Modal */}
      {showPreview && (
        <ExcelPreview
          previewData={previewData}
          onConfirm={handleConfirmPreview}
          onCancel={handleCancelPreview}
        />
      )}
    </div>
  );
}

export default Home;
