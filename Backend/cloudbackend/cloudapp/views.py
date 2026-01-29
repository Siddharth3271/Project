import cloudscraper
from bs4 import BeautifulSoup
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import CollaborationSession

# --- 1. Session Creation (Keep existing) ---
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_session(request):
    data = request.data
    initial_code = data.get('initial_code', '')
    language = data.get('language', 'cpp')

    session = CollaborationSession.objects.create(
        code=initial_code,
        language=language,
        created_by=request.user
    )
    return Response({'token': session.token}, status=status.HTTP_201_CREATED)

# --- 2. Codeforces Fetcher (Updated for HTML & Images) ---
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def fetch_codeforces_problem(request):
    contest_id = request.data.get("contest_id")
    problem_index = request.data.get("problem_index")

    if not contest_id or not problem_index:
        return Response(
            {"error": "contest_id and problem_index required"},
            status=400
        )

    contest_id = str(contest_id).strip()
    problem_index = str(problem_index).strip()

    url = f"https://codeforces.com/problemset/problem/{contest_id}/{problem_index}"
    print(f"Attempting to fetch: {url}")

    try:
        scraper = cloudscraper.create_scraper() 
        response = scraper.get(url, timeout=15)
        
        if response.status_code != 200:
             return Response({"error": f"Codeforces returned status {response.status_code}"}, status=502)

        soup = BeautifulSoup(response.text, 'html.parser')

        # --- FIX 1: Find and repair all image links ---
        # Codeforces images often start with "//" or "/" which breaks when viewed on localhost
        for img in soup.find_all('img'):
            src = img.get('src', '')
            if src.startswith('//'):
                img['src'] = f'https:{src}'
            elif src.startswith('/'):
                img['src'] = f'https://codeforces.com{src}'
            
            # Optional: Add styles to ensure large diagrams don't break the modal
            img['style'] = 'max-width: 100%; height: auto; display: block; margin: 10px auto;'

        # 1. Extract Title
        title_element = soup.select_one(".problem-statement .header .title")
        if not title_element:
            return Response({"error": "Failed to parse problem data."}, status=502)
        title = title_element.get_text(strip=True)

        # 2. Extract HTML Statement (Story + Input + Output + Note)
        statement_html_parts = []
        problem_node = soup.select_one(".problem-statement")
        
        if problem_node:
            # A. The Story
            for child in problem_node.children:
                if child.name == 'div':
                    classes = child.get('class', [])
                    # Skip header and specs sections for now
                    if any(c in classes for c in ['header', 'input-specification', 'output-specification', 'sample-tests', 'note']):
                        continue
                
                if child.name and child.name != 'script':
                    # str(child) preserves HTML tags like <p>, <ul>, and <img>
                    statement_html_parts.append(str(child))

            # Helper to format sections nicely
            def add_section(cls_name, title_override=None):
                section = problem_node.select_one(f".{cls_name}")
                if section:
                    # Convert Codeforces section title to a nice <h4>
                    section_title = section.select_one(".section-title")
                    if section_title:
                        section_title.name = "h4"
                        section_title['style'] = "margin-top: 16px; margin-bottom: 8px; font-weight: bold; font-size: 1.1em; color: #90cdf4;" # blue-300
                    
                    statement_html_parts.append(str(section))

            # B. Sections
            add_section("input-specification")
            add_section("output-specification")
            add_section("note")
        
        statement_html = "".join(statement_html_parts)

        # 3. Extract Samples (For the Inputs dropdown)
        samples = []
        inputs = soup.select(".input pre")
        outputs = soup.select(".output pre")
        
        count = min(len(inputs), len(outputs))
        for i in range(count):
            input_text = inputs[i].get_text(separator='\n', strip=True)
            output_text = outputs[i].get_text(separator='\n', strip=True)
            samples.append({
                "input": input_text,
                "output": output_text
            })

        data = {
            "title": title,
            "statement": statement_html, # Now sending HTML!
            "url": url,
            "samples": samples
        }
        
        print("Successfully fetched problem!")
        return Response(data, status=200)

    except Exception as e:
        print(f"Scraping exception: {str(e)}")
        return Response({"error": str(e)}, status=500)