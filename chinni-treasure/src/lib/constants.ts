export const ORDER_STATUS_FLOW = [
  "pending",
  "approved",
  "packaging",
  "shipped",
  "delivered",
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  packaging: "Packaging",
  shipped: "Shipped",
  delivered: "Delivered",
  rejected: "Rejected",
};

export const ORDER_STATUS_FILTERS = [
  { key: "all", label: "All Orders" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "packaging", label: "Packaging" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "rejected", label: "Rejected" },
];

export const ORDER_STATUS_ICONS: Record<string, string> = {
  pending: "⏳",
  approved: "✓",
  packaging: "📦",
  shipped: "🚚",
  delivered: "✅",
  rejected: "✕",
};

export const INDIAN_STATES = [
  { code: "AN", name: "Andaman and Nicobar Islands" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CH", name: "Chandigarh" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "DN", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "DL", name: "Delhi" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JK", name: "Jammu and Kashmir" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OR", name: "Odisha" },
  { code: "PY", name: "Puducherry" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TG", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "UT", name: "Uttarakhand" },
  { code: "WB", name: "West Bengal" },
] as const;

export const INDIAN_CITIES: Record<string, string[]> = {
  AN: ["Port Blair", "Diglipur", "Mayabunder", "Rangat"],
  AP: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur", "Ongole", "Eluru", "Machilipatnam", "Chittoor", "Srikakulam", "Vizianagaram", "Bhimavaram", "Narsapur", "Proddatur", "Hindupur"],
  AR: ["Itanagar", "Naharlagun", "Pasighat", "Tezpur", "Bomdila", "Tawang", "Ziro", "Along", "Yinkiong", "Khonsa"],
  AS: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Tezpur", "Nagaon", "Tinsukia", "Bongaigaon", "Dhubri", "Sivasagar", "Goalpara", "Barpeta", "Lakhimpur", "Dima Hasao", "Karimganj", "Hailakandi", "Golaghat", "North Lakhimpur", "Morigaon", "Nalbari"],
  BR: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Arrah", "Begusarai", "Katihar", "Munger", "Purnia", "Saharsa", "Nawada", "Buxar", "Siwan", "Vaishali", "East Champaran", "West Champaran", "Samastipur", "Aurangabad", "Jehanabad", "Kishanganj", "Rohtas"],
  CH: ["Chandigarh"],
  CT: ["Raipur", "Bhilai", "Durg", "Bilaspur", "Korba", "Ambikapur", "Jagdalpur", "Rajnandgaon", "Dhamtari", "Raigarh", "Jagdalpur", "Surguja", "Kawardha"],
  DN: ["Silvassa", "Daman", "Diu", "Valsad"],
  DL: ["New Delhi", "Delhi", "Noida", "Gurgaon", "Faridabad", "Ghaziabad"],
  GA: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Quepem", "Curchorem", "Sanquelim", "Bicholim", "Canacona"],
  GJ: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Nadiad", "Mehsana", "Bharuch", "Vapi", "Gandhidham", "Porbandar", "Veraval", "Patan", "Navsari", "Surendranagar", "Amreli", "Valsad", "Dahod", "Himmatnagar", "Godhra"],
  HR: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Panchkula", "Sonipat", "Yamunanagar", "Kurukshetra", "Jind", "Bhiwani", "Sirsa", "Bahadurgarh", "Kaithal", "Rewari", "Palwal", "Nuh", "Fatehabad"],
  HP: ["Shimla", "Manali", "Dharamshala", "Kullu", "Mandi", "Solan", "Baddi", "Nahan", "Hamirpur", "Bilaspur", "Una", "Kangra", "Chamba", "Kinnaur", "Lahaul and Spiti", "Sirmaur", "Kasauli"],
  JK: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore", "Kathua", "Udhampur", "Punch", "Rajouri", "Kupwara", "Bandipora", "Ganderbal", "Shopian", "Kulgam", "Pulwama", "Doda", "Kishtwar", "Ramban"],
  JH: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih", "Chaibasa", "Medininagar", "Dumka", "Godda", "Sahebganj", "Pakur", "Lohardaga", "Gumla", "Simdega", "Khunti", "Latehar", "Palamu", "West Singhbhum"],
  KA: ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belgaum", "Kalaburagi", "Davangere", "Ballari", "Vijayapura", "Tumakuru", "Shivamogga", "Hassan", "Udupi", "Chikkamagaluru", "Raichur", "Bidar", "Mandya", "Hospet", "Gadag", "Haveri", "Chitradurga", "Kolar", "Ramanagara", "Chikkaballapur", "Kodagu"],
  KL: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Kollam", "Thrissur", "Kottayam", "Alappuzha", "Malappuram", "Palakkad", "Kannur", "Kasaragod", "Idukki", "Wayanad", "Pathanamthitta", "Ernakulam"],
  LA: ["Leh", "Kargil", "Nubra", "Zanskar"],
  LD: ["Kavaratti", "Agatti", "Minicoy", "Amini"],
  MP: ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Murwara", "Singrauli", "Bhind", "Chhindwara", "Guna", "Shivpuri", "Vidisha", "Bhopal", "Sehore", "Betul", "Hoshangabad", "Narsinghpur", "Damoh", "Katni", "Mandla", "Dhar", "Jhabua", "Khargone", "Barwani", "Harda"],
  MH: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Jalna", "Amravati", "Kolhapur", "Nanded", "Sangli", "Akola", "Latur", "Ahmednagar", "Chandrapur", "Parbhani", "Wardha", "Yavatmal", "Beed", "Hingoli", "Washim", "Buldhana", "Palghar", "Raigad", "Ratnagiri", "Sindhudurg"],
  MN: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul", "Chandel", "Senapati", "Tamenglong", "Jiribam", "Kakching"],
  ML: ["Shillong", "Tura", "Cherrapunji", "Jowai", "Baghmara", "Nongstoin", "Williamnagar", "Resubelpara"],
  MZ: ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit"],
  NL: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Phek", "Kiphire", "Longleng", "Noklak", "Peren"],
  OR: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jeypore", "Kendrapara", "Rayagada", "Koraput", "Dhenkanal", "Angul", "Jharsuguda", "Keonjhar", "Mayurbhanj", "Sundergarh", "Kalahandi"],
  PY: ["Puducherry", "Karaikal", "Mahe", "Yanam"],
  PB: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Batala", "Moga", "Abohar", "Malerkotla", "Phagwara", "Muktsar", "Khanna", "Barnala", "Rajpura", "Kapurthala", "Faridkot", "Sangrur"],
  RJ: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar", "Bharatpur", "Sikar", "Pali", "Kishangarh", "Baran", "Dungarpur", "Churu", "Jhunjhunu", "Tonk", "Bhilwara", "Hanumangarh", "Nagaur", "Sawai Madhopur", "Dausa", "Jalor", "Barmer", "Jaisalmer", "Rajsamand"],
  SK: ["Gangtok", "Namchi", "Geyzing", "Rangpo", "Singtam", "Jorethang"],
  TN: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Tiruppur", "Kancheepuram", "Nagercoil", "Cuddalore", "Kumbakonam", "Tiruvannamalai", "Pollachi", "Rajapalayam", "Gudiyatham", "Kanchipuram", "Vaniyambadi", "Ambur"],
  TG: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahabubnagar", "Nalgonda", "Adilabad", "Medak", "Rangareddy", "Siddipet", "Vikarabad", "Mancherial", "Kamareddy", "Suryapet", "Jagtial", "Peddapalli", "Mulugu", "Jayashankar Bhupalpally"],
  TR: ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia", "Ambassa", "Khowai", "Sabroom"],
  UP: ["Lucknow", "Noida", "Varanasi", "Agra", "Kanpur", "Prayagraj", "Ghaziabad", "Meerut", "Bareilly", "Aligarh", "Moradabad", "Jhansi", "Gorakhpur", "Saharanpur", "Agra", "Bijnor", "Muzaffarnagar", "Mathura", "Rampur", "Firozabad", "Budaun", "Bulandshahr", "Shahjahanpur", "Jaunpur", "Azamgarh", "Ayodhya", "Bahraich", "Faizabad", "Sitapur", "Hardoi", "Unnao", "Rae Bareli", "Kanpur Dehat", "Etawah", "Mainpuri", "Farrukhabad", "Banda", "Mahoba", "Hamirpur", "Jalaun", "Orai", "Lalitpur", "Chitrakoot", "Pratapgarh", "Amethi", "Sultanpur", "Mirzapur", "Bhadohi", "Chandauli", "Sonbhadra", "Ghazipur", "Mau", "Ballia", "Varanasi"],
  UT: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Kashipur", "Rishikesh", "Mussoorie", "Almora", "Nainital", "Uttarkashi", "Chamoli", "Tehri Garhwal", "Pithoragarh", "Champawat", "Bageshwar", "Udham Singh Nagar"],
  WB: ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Kharagpur", "Malda", "Barrackpore", "Kamarhati", "Halisahar", "Naihati", "Bhatpara", "Ghusuri", "Chandannagar", "Rishra", "Serampore", "Titagarh", "Bally", "Uluberia", "Shrirampore", "Konnagar", "Amta", "Uttarpara Kotrung", "Belgharia"],
} as const;

export const TAMIL_NADU_STATE_CODE = "TN";
export const FREE_SHIPPING_THRESHOLD = 599;
export const SHIPPING_CHARGES = {
  WITHIN_TAMIL_NADU: 150,
  OUTSIDE_TAMIL_NADU: 200,
} as const;

export function calcShippingCost(subtotal: number, stateCode: string): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;
  return stateCode === TAMIL_NADU_STATE_CODE
    ? SHIPPING_CHARGES.WITHIN_TAMIL_NADU
    : SHIPPING_CHARGES.OUTSIDE_TAMIL_NADU;
}
