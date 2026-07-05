from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse, CurrentUserResponse
from app.utils.security import hash_password, verify_password, create_access_token
from app.api.auth.deps import get_current_active_user

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """
    Creates a new student account, hashes the password, and returns a JWT access token.
    """
    # Check for existing email address
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Hash the plain-text password
    hashed_pwd = hash_password(user_in.password)

    # Instantiate new database user
    db_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        password_hash=hashed_pwd,
        role="student",
        is_active=True,
        is_verified=False
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database insertion failed: {str(e)}"
        )

    # Generate token payload
    token_payload = {"sub": db_user.email}
    access_token = create_access_token(token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }


@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Verifies user email/password credentials and issues a JWT token.
    """
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account"
        )

    # Generate token payload
    token_payload = {"sub": user.email}
    access_token = create_access_token(token_payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me", response_model=CurrentUserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """
    Retrieves the currently logged-in user profile details.
    """
    return current_user


@router.post("/logout")
def logout():
    """
    Placeholder endpoint to log out users. Token revocation is managed client-side.
    """
    return {"detail": "Successfully logged out"}
