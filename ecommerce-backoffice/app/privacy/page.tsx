import React from "react";

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-red-600 mb-4">
              Нууцлалын бодлого
            </h1>
            <h2 className="text-xl text-gray-600 mb-4">
              Өгөөж Чихэр Боов ХХК - Ажилтны гар утасны апп
            </h2>
            <p className="text-gray-700 italic">
              Энэхүү нууцлалын бодлого нь Өгөөж Чихэр Боов ХХК-ний ажилтнуудын гар утасны апп-д хэрэглэгддэг.
            </p>
          </div>
          
          <div className="bg-white shadow-lg rounded-lg p-6 sm:p-8">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
                <span className="mr-2">🏢</span>
                Танилцуулга
              </h2>
              <p className="text-gray-700 mb-4">
                Өгөөж Чихэр Боов ХХК нь таны хувийн мэдээллийн нууцлалыг хамгаалахыг чухалчилдаг. 
                Энэхүү нууцлалын бодлого нь манай ажилтнуудын гар утасны аппыг ашиглах явцад бид 
                таны мэдээллийг хэрхэн цуглуулж, боловсруулж, хадгалах талаар тайлбарласан юм.
              </p>
              <p className="text-gray-700">
                Энэ апп нь зөвхөн Өгөөж Чихэр Боов ХХК-ний ажилтнуудад зориулагдсан бөгөөд 
                компанийн дотоод үйл ажиллагааг дэмжих, ажлын үр дүнг сайжруулах зорилготой юм.
              </p>
            </section>
            
            <div className="border-t border-gray-200 my-8"></div>
            
            {/* Data Collection Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
                <span className="mr-2">📊</span>
                Цуглуулдаг мэдээлэл
              </h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center">
                <span className="mr-2">👤</span>
                Хувийн мэдээлэл
              </h3>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li><strong>Овог, нэр, албан тушаал</strong> - Апп-д нэвтрэх, хэрэглэгчийн профайл үүсгэхэд ашиглагдана</li>
                <li><strong>Утасны дугаар, имэйл хаяг</strong> - Холбоо барих, баталгаажуулалт хийхэд ашиглагдана</li>
                <li><strong>Ажлын байрны мэдээлэл</strong> - Хэлтэс, албан тушаал, ажлын цаг зэрэг мэдээлэл</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center">
                <span className="mr-2">📱</span>
                Төхөөрөмжийн мэдээлэл
              </h3>
              <ul className="list-disc pl-5 text-gray-700 space-y-2">
                <li><strong>Төхөөрөмжийн загвар, үйлдлийн систем</strong> - Аппыг төхөөрөмжид тохируулах, дэмжлэг үзүүлэхэд ашиглагдана</li>
                <li><strong>IP хаяг, төхөөрөмжийн ID</strong> - Аюулгүй байдал, нэвтрэлтийг хянах зорилгоор цуглуулдаг</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3 flex items-center">
                <span className="mr-2">📍</span>
                Байршил мэдээлэл
              </h3>
              <p className="text-gray-700">
                Ажлын цаг бүртгэх, ажлын явц хянах зорилгоор байршил мэдээллийг цуглуулж болно. 
                Байршил мэдээллийг цуглуулахын өмнө таны зөвшөөрлийг авна.
              </p>
            </section>
            
            <div className="border-t border-gray-200 my-8"></div>
            
            {/* Data Usage Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
                <span className="mr-2">🎯</span>
                Мэдээллийг ашиглах зорилго
              </h2>
              
              <ul className="list-disc pl-5 text-gray-700 space-y-3">
                <li>
                  <strong>Аппын үндсэн үйлчилгээг үзүүлэх</strong> 
                  <p className="text-gray-600 text-sm mt-1">Апп-д нэвтрэх, ажлын мэдээлэл харах, ажлын цаг бүртгэх зэрэг үйлчилгээ</p>
                </li>
                <li>
                  <strong>Аюулгүй байдал</strong>
                  <p className="text-gray-600 text-sm mt-1">Хандалтыг хянах, гажуудал илрүүлэх, мэдээллийн аюулгүй байдлыг хангах</p>
                </li>
                <li>
                  <strong>Аппыг сайжруулах</strong>
                  <p className="text-gray-600 text-sm mt-1">Аппын гүйцэтгэлд дүн шинжилгээ хийх, алдаа засах, шинэ функц нэмэх</p>
                </li>
                <li>
                  <strong>Холбоо барих</strong>
                  <p className="text-gray-600 text-sm mt-1">Шаардлагатай мэдээлэл, шинэчлэлтүүдийг танд мэдээлэх</p>
                </li>
                <li>
                  <strong>Ажлын үр дүн дээшлүүлэх</strong>
                  <p className="text-gray-600 text-sm mt-1">Ажилтнуудын бүтээмжийн дүн шинжилгээ, сургалт хөтөлбөр боловсруулах</p>
                </li>
              </ul>
            </section>
            
            <div className="border-t border-gray-200 my-8"></div>
            
            {/* Data Protection Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center">
                <span className="mr-2">🔒</span>
                Мэдээллийн аюулгүй байдал
              </h2>
              
              <p className="text-gray-700 mb-4">
                Бид таны мэдээллийг хадгалахдаа дараах арга хэмжээг авч байна:
              </p>
              
              <ul className="list-disc pl-5 text-gray-700 space-y-3">
                <li>
                  <strong>Шифрлэлт</strong>
                  <p className="text-gray-600 text-sm mt-1">Мэдээллийг дамжуулах, хадгалах явцад шифрлэлтийн технологи ашигладаг</p>
                </li>
                <li>
                  <strong>Хандалтын хязгаарлалт</strong>
                  <p className="text-gray-600 text-sm mt-1">Зөвхөн шаардлагатай ажилтнууд л мэдээлэлд хандах боломжтой</p>
                </li>
                <li>
                  <strong>Тогтмол хяналт</strong>
                  <p className="text-gray-600 text-sm mt-1">Мэдээллийн аюулгүй байдлын системийг тогтмол хянаж шинэчилдэг</p>
                </li>
              </ul>
              
              <p className="text-gray-700 italic mt-4">
                Гэхдээ интернэтээр дамжуулагддаг мэдээлэл бүрэн аюулгүй гэдэгт баталгаа байхгүйг анхаарна уу.
              </p>
            </section>
            
            <div className="border-t border-gray-200 my-8"></div>
            
            {/* Data Sharing Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Гуравдагч этгээдэд мэдээлэл өгөх
              </h2>
              
              <p className="text-gray-700 mb-4">
                Өгөөж Чихэр Боов ХХК нь хуулийн шаардлага гарвал эсвэл дараах тохиолдолдээ л 
                таны мэдээллийг гуравдагч этгээдэд өгөх боломжтой:
              </p>
              
              <ul className="list-disc pl-5 text-gray-700 space-y-3">
                <li>
                  <strong>Хууль ёсны шаардлага</strong>
                  <p className="text-gray-600 text-sm mt-1">Хууль, шүүхийн тушаал, захиргааны шаардлагад нийцүүлэх</p>
                </li>
                <li>
                  <strong>Компанийн эрх ашиг хамгаалах</strong>
                  <p className="text-gray-600 text-sm mt-1">Компанийн эрх, аюулгүй байдал, эд хөрөнгийг хамгаалах</p>
                </li>
                <li>
                  <strong>Үйлчилгээний түншүүд</strong>
                  <p className="text-gray-600 text-sm mt-1">Зөвхөн бидэнтэй нууцлалын гэрээ байгуулсан, шаардлагатай түншүүдэд л өгнө</p>
                </li>
              </ul>
            </section>
            
            <div className="border-t border-gray-200 my-8"></div>
            
            {/* Employee Rights Section */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-red-600 mb-4">
                Ажилтны эрх
              </h2>
              
              <p className="text-gray-700 mb-4">
                Та дараах эрхүүдээр хангагдсан болно:
              </p>
              
              <ul className="list-disc pl-5 text-gray-700 space-y-3">
                <li>
                  <strong>Мэдээлэл харах эрх</strong>
                  <p className="text-gray-600 text-sm mt-1">Бид таны тухай хадгалж буй мэдээллийг харах боломж олгоно</p>
                </li>
                <li>
                  <strong>Мэдээлэл засах эрх</strong>
                  <p className="text-gray-600 text-sm mt-1">Худал, дутуу мэдээллийг засах боломжтой</p>
                </li>
                <li>
                  <strong>Мэдээлэл устгах эрх</strong>
                  <p className="text-gray-600 text-sm mt-1">Ажлаас халагдсан тохиолдолд мэдээлэл устгах эрхтэй</p>
                </li>
                <li>
                  <strong>Мэдээлэл цуглуулахыг зогсоох эрх</strong>
                  <p className="text-gray-600 text-sm mt-1">Тодорхой мэдээлэл цуглуулахыг зогсоох хүсэлт гаргах боломжтой</p>
                </li>
              </ul>
            </section>
            
            <div className="border-t border-gray-200 my-8"></div>
            
            {/* Contact Section */}
            <section className="text-center mt-10 p-6 bg-red-600 text-white rounded-lg">
              <h3 className="text-2xl font-bold mb-4">📞 Асуулт, санал хүсэлт</h3>
              <p className="mb-4">
                Нууцлалын бодлоготой холбоотой асуулт, санал хүсэлтээ дараах хаягаар илгээнэ үү:
              </p>
              <div className="mt-4">
                <h4 className="text-xl font-semibold mb-2">Өгөөж Чихэр Боов ХХК</h4>
                <p>Мэдээлэл технологийн хэлтэс</p>
                <p>Утас: +976-99072454</p>
                <p>Имэйл: it@uguuj.mn</p>
              </div>
            </section>
            
            {/* Last Updated */}
            <div className="mt-8 text-center">
              <p className="text-gray-500 text-sm">
                Сүүлд шинэчилсэн: {new Date().toLocaleDateString('mn-MN', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-gray-500 text-sm mt-2">
                © {new Date().getFullYear()} Өгөөж Чихэр Боов ХХК. Бүх эрх хуулиар хамгаалагдсан.
              </p>
            </div>
          </div>
        </div>
    </div>
  );
};

export default PrivacyPolicyPage;
