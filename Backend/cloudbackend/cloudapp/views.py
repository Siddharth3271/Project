import cloudscraper
from bs4 import BeautifulSoup
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from .models import CollaborationSession

#Session Creation
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

#Codeforces Fetcher
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

        #Codeforces images
        for img in soup.find_all('img'):
            src = img.get('src', '')
            if src.startswith('//'):
                img['src'] = f'https:{src}'
            elif src.startswith('/'):
                img['src'] = f'https://codeforces.com{src}'
            
            #Add styles to stablize large diagrams
            img['style'] = 'max-width: 100%; height: auto; display: block; margin: 10px auto;'

        #Extract Title
        title_element = soup.select_one(".problem-statement .header .title")
        if not title_element:
            return Response({"error": "Failed to parse problem data."}, status=502)
        title = title_element.get_text(strip=True)

        #Extract HTML Statement (Story + Input + Output + Note)
        statement_html_parts = []
        problem_node = soup.select_one(".problem-statement")
        
        if problem_node:
            #The Story
            for child in problem_node.children:
                if child.name == 'div':
                    classes = child.get('class', [])
                    # Skip header and specs sections
                    if any(c in classes for c in ['header', 'input-specification', 'output-specification', 'sample-tests', 'note']):
                        continue
                
                if child.name and child.name != 'script':
                    # str(child) preserves HTML tags like <p>, <ul>, and <img>
                    statement_html_parts.append(str(child))

            #formatting sections
            def add_section(cls_name, title_override=None):
                section = problem_node.select_one(f".{cls_name}")
                if section:
                    #codeforces title
                    section_title = section.select_one(".section-title")
                    if section_title:
                        section_title.name = "h4"
                        section_title['style'] = "margin-top: 16px; margin-bottom: 8px; font-weight: bold; font-size: 1.1em; color: #90cdf4;"
                    
                    statement_html_parts.append(str(section))

            #Sections
            add_section("input-specification")
            add_section("output-specification")
            add_section("note")
        
        statement_html = "".join(statement_html_parts)

        #Extract Samples testcases
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
            "statement": statement_html, # Now sending HTML
            "url": url,
            "samples": samples
        }
        
        print("Successfully fetched problem!")
        return Response(data, status=200)

    except Exception as e:
        print(f"Scraping exception: {str(e)}")
        return Response({"error": str(e)}, status=500)
    
#Request Reset View Link
class RequestPasswordResetEmail(APIView):
    permission_classes = [AllowAny] # Anyone can request a reset

    def post(self, request):
        email = request.data.get('email')
        
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            
            # Generate secure token and encoded user ID
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            token = PasswordResetTokenGenerator().make_token(user)
            
            # Create the link that points to your React frontend
            # Ensure this matches your React app's URL!
            frontend_url = "http://localhost:5173" 
            reset_link = f"{frontend_url}/reset-password/{uidb64}/{token}"
            
            # Send the email
            email_body = f"Hello \n\nUse this link to reset your password:\n{reset_link}\n\nIf you didn't request this, ignore this email."
            send_mail(
                subject='Password Reset Request',
                message=email_body,
                from_email='noreply@codemate.com',
                recipient_list=[user.email],
                fail_silently=False,
            )
            
        # We always return 'success' even if the email doesn't exist.
        # This prevents hackers from guessing which emails are registered.
        return Response({'success': 'If your email is registered, a link has been sent.'}, status=status.HTTP_200_OK)

#Complete Password Reset View
class SetNewPassword(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            password = request.data.get('password')
            uidb64 = request.data.get('uidb64')
            token = request.data.get('token')

            # Decode the user ID
            id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=id)

            # Validate the token
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'error': 'Token is invalid or expired'}, status=status.HTTP_400_BAD_REQUEST)

            # Set the new password and save
            user.set_password(password)
            user.save()
            
            return Response({'success': 'Password reset successfully'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': 'Something went wrong'}, status=status.HTTP_400_BAD_REQUEST)
