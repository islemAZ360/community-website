import os

# اسم الملف الناتج
output_file = "project_context.txt"

# المجلدات التي سيتم تجاهلها تماماً
ignore_dirs = {
    'node_modules', '.git', 'dist', 'build', 'bin', 'release', 
    'dist-electron', '.vscode', '.github', '__pycache__'
}

# الملفات المحددة التي سيتم تجاهلها
ignore_files = {
    'package-lock.json', 'bun.lockb', 'yarn.lock', 'full_code.txt', 
    'project_context.txt', 'ggml-base.bin'
}

# الامتدادات التي تريد قراءتها (أضف أو احذف حسب حاجتك)
allowed_extensions = {
    '.ts', '.tsx', '.js', '.jsx', '.py', '.html', '.css', '.json', '.md', '.env'
}

def collect_code():
    with open(output_file, 'w', encoding='utf-8') as outfile:
        # المرور عبر جميع الملفات والمجلدات
        for root, dirs, files in os.walk('.'):
            # تعديل القائمة dirs لاستبعاد المجلدات غير المرغوب فيها ومنع الدخول إليها
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            
            for file in files:
                if file in ignore_files:
                    continue
                
                _, ext = os.path.splitext(file)
                if ext in allowed_extensions:
                    file_path = os.path.join(root, file)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                            
                            # كتابة فواصل واضحة بين الملفات للذكاء الاصطناعي
                            outfile.write(f"\n{'='*50}\n")
                            outfile.write(f"File Path: {file_path}\n")
                            outfile.write(f"{'='*50}\n\n")
                            outfile.write(content + "\n")
                            print(f"Added: {file_path}")
                    except Exception as e:
                        print(f"Skipped (Error): {file_path} - {e}")

    print(f"\nDone! All code collected in: {output_file}")

if __name__ == "__main__":
    collect_code()